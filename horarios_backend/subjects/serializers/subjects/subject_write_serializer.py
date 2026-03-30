from rest_framework import serializers
from careers.models import CareerSubjects, Careers
from subjects.models import Subjects
from teachers.models import Teachers, TeachersSubjects

class SubjectWriteSerializer(serializers.ModelSerializer):
    careers = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
    )
    teachers = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Subjects
        fields = [
            'name',
            'short_name',
            'code',
            'description',
            'hours_per_week',
            'color',
            'is_mandatory',
            'careers',
            'teachers',
        ]

    def validate_hours_per_week(self, value):
        if value <= 0:
            raise serializers.ValidationError("Debe ser mayor a 0")
        return value

    def _parse_careers_payload(self, careers_payload):
        parsed_rows = []

        for item in careers_payload:
            if isinstance(item, dict):
                raw_career_id = (
                    item.get('career_id')
                    or item.get('id')
                    or item.get('value')
                )
                raw_period_number = item.get('period_number', 1)
            else:
                raw_career_id = item
                raw_period_number = 1

            try:
                career_id = int(raw_career_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'careers': 'Cada carrera debe tener un id válido.'}
                )

            try:
                period_number = int(raw_period_number)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'careers': 'Cada carrera debe tener period_number válido.'}
                )

            if period_number <= 0:
                raise serializers.ValidationError(
                    {'careers': 'El period_number debe ser mayor a 0.'}
                )

            parsed_rows.append(
                {
                    'career_id': career_id,
                    'period_number': period_number,
                }
            )

        unique_rows = []
        seen = set()
        for row in parsed_rows:
            key = (row['career_id'], row['period_number'])
            if key in seen:
                continue
            seen.add(key)
            unique_rows.append(row)

        return unique_rows

    def _sync_subject_career_relations(self, subject, parsed_careers):
        existing_relations = CareerSubjects.objects.filter(subjects=subject)
        active_relations = existing_relations.filter(is_deleted=0)

        incoming_keys = {
            (row['career_id'], row['period_number'])
            for row in parsed_careers
        }

        for relation in active_relations:
            relation_key = (relation.careers_id, relation.period_number)
            if relation_key not in incoming_keys:
                relation.is_deleted = 1
                relation.save(update_fields=['is_deleted'])

        for row in parsed_careers:
            relation_key = (row['career_id'], row['period_number'])

            if active_relations.filter(
                careers_id=relation_key[0],
                period_number=relation_key[1],
            ).exists():
                continue

            soft_deleted_relation = existing_relations.filter(
                careers_id=relation_key[0],
                period_number=relation_key[1],
                is_deleted=1,
            ).first()

            if soft_deleted_relation:
                soft_deleted_relation.is_deleted = 0
                soft_deleted_relation.save(update_fields=['is_deleted'])
                continue

            CareerSubjects.objects.create(
                subjects=subject,
                careers_id=relation_key[0],
                period_number=relation_key[1],
                is_deleted=0,
            )

    def _parse_teachers_payload(self, teachers_payload):
        parsed_ids = []

        for item in teachers_payload:
            if isinstance(item, dict):
                raw_teacher_id = (
                    item.get('teacher_id')
                    or item.get('id')
                    or item.get('value')
                )
            else:
                raw_teacher_id = item

            try:
                teacher_id = int(raw_teacher_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'teachers': 'Cada profesor debe tener un id válido.'}
                )

            parsed_ids.append(teacher_id)

        return sorted(set(parsed_ids))

    def _sync_subject_teacher_relations(self, subject, parsed_teacher_ids):
        existing_relations = TeachersSubjects.objects.filter(subjects=subject)
        active_relations = existing_relations.filter(is_deleted=0)

        incoming_ids = set(parsed_teacher_ids)

        for relation in active_relations:
            if relation.teachers_id not in incoming_ids:
                relation.is_deleted = 1
                relation.save(update_fields=['is_deleted'])

        for teacher_id in incoming_ids:
            if active_relations.filter(teachers_id=teacher_id).exists():
                continue

            soft_deleted_relation = existing_relations.filter(
                teachers_id=teacher_id,
                is_deleted=1,
            ).first()

            if soft_deleted_relation:
                soft_deleted_relation.is_deleted = 0
                soft_deleted_relation.save(update_fields=['is_deleted'])
                continue

            TeachersSubjects.objects.create(
                teachers_id=teacher_id,
                subjects=subject,
                is_deleted=0,
            )

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')

        if not selected_university_id and self.instance:
            selected_university_id = self.instance.university_id

        if 'careers' in attrs:
            parsed_careers = self._parse_careers_payload(attrs.get('careers') or [])
            career_ids = {row['career_id'] for row in parsed_careers}

            careers_in_university = set(
                Careers.objects.filter(
                    id__in=career_ids,
                    is_deleted=0,
                    university_id=selected_university_id,
                ).values_list('id', flat=True)
            )

            invalid_ids = sorted(career_ids - careers_in_university)
            if invalid_ids:
                raise serializers.ValidationError(
                    {
                        'careers': (
                            'Las carreras no pertenecen a la universidad '
                            f'seleccionada: {invalid_ids}'
                        )
                    }
                )

            attrs['_parsed_careers'] = parsed_careers

        teachers_payload = None
        if 'teachers' in attrs:
            teachers_payload = attrs.get('teachers') or []
        elif 'professors' in self.initial_data:
            teachers_payload = self.initial_data.get('professors') or []

        if teachers_payload is not None:
            parsed_teachers = self._parse_teachers_payload(teachers_payload)

            existing_teachers = set(
                Teachers.objects.filter(
                    id__in=parsed_teachers,
                    is_deleted=0,
                ).values_list('id', flat=True)
            )

            invalid_teacher_ids = sorted(set(parsed_teachers) - existing_teachers)
            if invalid_teacher_ids:
                raise serializers.ValidationError(
                    {
                        'teachers': (
                            'Los profesores no son válidos o no están disponibles: '
                            f'{invalid_teacher_ids}'
                        )
                    }
                )

            attrs['_parsed_teachers'] = parsed_teachers

        return attrs

    def create(self, validated_data):
        """ Crea una materia con status activo por defecto """
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        parsed_careers = validated_data.pop('_parsed_careers', [])
        parsed_teachers = validated_data.pop('_parsed_teachers', [])
        validated_data.pop('careers', None)
        validated_data.pop('teachers', None)

        validated_data['is_mandatory'] = validated_data.get('is_mandatory', 1)
        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0

        subject = Subjects.objects.create(**validated_data)
        self._sync_subject_career_relations(subject, parsed_careers)
        self._sync_subject_teacher_relations(subject, parsed_teachers)
        return subject

    def update(self, instance, validated_data):
        parsed_careers = validated_data.pop('_parsed_careers', None)
        parsed_teachers = validated_data.pop('_parsed_teachers', None)
        validated_data.pop('careers', None)
        validated_data.pop('teachers', None)

        subject = super().update(instance, validated_data)

        if parsed_careers is not None:
            self._sync_subject_career_relations(subject, parsed_careers)

        if parsed_teachers is not None:
            self._sync_subject_teacher_relations(subject, parsed_teachers)

        return subject