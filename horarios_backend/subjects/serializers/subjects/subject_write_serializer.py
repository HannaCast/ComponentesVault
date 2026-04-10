from rest_framework import serializers
from classrooms.models import ClassroomTypes
from careers.models import CareerSubjects, Careers
from subjects.models import Subjects, SubjectsClassroomTypes
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
    classroom_types = serializers.ListField(
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
            'is_restricted_to_classroom_types',
            'is_mandatory',
            'careers',
            'teachers',
            'classroom_types',
        ]

    def validate_hours_per_week(self, value):
        if value <= 0:
            raise serializers.ValidationError("Debe ser mayor a 0")
        return value

    def validate_is_restricted_to_classroom_types(self, value):
        if value not in (0, 1):
            raise serializers.ValidationError('Debe ser 0 o 1.')
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

    def _parse_classroom_types_payload(self, classroom_types_payload):
        parsed_ids = []

        for item in classroom_types_payload:
            if isinstance(item, dict):
                raw_type_id = (
                    item.get('classroom_type_id')
                    or item.get('id')
                    or item.get('value')
                )
            else:
                raw_type_id = item

            try:
                classroom_type_id = int(raw_type_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'classroom_types': 'Cada tipo de aula debe tener un id valido.'}
                )

            parsed_ids.append(classroom_type_id)

        return sorted(set(parsed_ids))

    def _sync_subject_classroom_type_relations(self, subject, parsed_classroom_type_ids):
        existing_relations = SubjectsClassroomTypes.objects.filter(subject=subject)
        active_relations = existing_relations.filter(is_deleted=0)

        incoming_ids = set(parsed_classroom_type_ids)

        for relation in active_relations:
            if relation.classroom_type_id not in incoming_ids:
                relation.is_deleted = 1
                relation.save(update_fields=['is_deleted'])

        for classroom_type_id in incoming_ids:
            if active_relations.filter(classroom_type_id=classroom_type_id).exists():
                continue

            soft_deleted_relation = existing_relations.filter(
                classroom_type_id=classroom_type_id,
                is_deleted=1,
            ).first()

            if soft_deleted_relation:
                soft_deleted_relation.is_deleted = 0
                soft_deleted_relation.save(update_fields=['is_deleted'])
                continue

            SubjectsClassroomTypes.objects.create(
                subject=subject,
                classroom_type_id=classroom_type_id,
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

        current_restricted_classroom_types = bool(
            self.instance.is_restricted_to_classroom_types
        ) if self.instance else False
        effective_restricted_classroom_types = bool(
            attrs.get(
                'is_restricted_to_classroom_types',
                self.instance.is_restricted_to_classroom_types if self.instance else 0,
            )
        )

        classroom_types_payload = None
        classroom_types_in_payload = False
        if 'classroom_types' in attrs:
            classroom_types_payload = attrs.get('classroom_types') or []
            classroom_types_in_payload = True
        elif 'classroom_types' in self.initial_data:
            classroom_types_payload = self.initial_data.get('classroom_types') or []
            classroom_types_in_payload = True

        parsed_classroom_types = None
        if classroom_types_payload is not None:
            parsed_classroom_types = self._parse_classroom_types_payload(classroom_types_payload)

            existing_classroom_types = set(
                ClassroomTypes.objects.filter(
                    id__in=parsed_classroom_types,
                    is_deleted=0,
                    status=1,
                ).values_list('id', flat=True)
            )

            invalid_classroom_type_ids = sorted(set(parsed_classroom_types) - existing_classroom_types)
            if invalid_classroom_type_ids:
                raise serializers.ValidationError(
                    {
                        'classroom_types': (
                            'Los tipos de aula no son validos o no estan disponibles: '
                            f'{invalid_classroom_type_ids}'
                        )
                    }
                )

        # Si classroom_types viene en el payload, su contenido gobierna la bandera.
        if classroom_types_in_payload:
            effective_restricted_classroom_types = bool(parsed_classroom_types)
            attrs['is_restricted_to_classroom_types'] = 1 if parsed_classroom_types else 0

        if (
            effective_restricted_classroom_types
            and not current_restricted_classroom_types
            and parsed_classroom_types is None
        ):
            raise serializers.ValidationError(
                {
                    'classroom_types': (
                        'Debes enviar classroom_types al activar '
                        'is_restricted_to_classroom_types.'
                    )
                }
            )

        if effective_restricted_classroom_types and parsed_classroom_types == []:
            raise serializers.ValidationError(
                {
                    'classroom_types': (
                        'Debes indicar al menos un tipo de aula cuando '
                        'is_restricted_to_classroom_types es 1.'
                    )
                }
            )

        if parsed_classroom_types is not None:
            attrs['_parsed_classroom_types'] = parsed_classroom_types

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
        parsed_classroom_types = validated_data.pop('_parsed_classroom_types', [])
        validated_data.pop('careers', None)
        validated_data.pop('teachers', None)
        validated_data.pop('classroom_types', None)

        validated_data['is_mandatory'] = validated_data.get('is_mandatory', 1)
        validated_data['is_restricted_to_classroom_types'] = (
            validated_data.get('is_restricted_to_classroom_types', 0) or 0
        )
        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0

        subject = Subjects.objects.create(**validated_data)
        self._sync_subject_career_relations(subject, parsed_careers)
        self._sync_subject_teacher_relations(subject, parsed_teachers)
        if subject.is_restricted_to_classroom_types:
            self._sync_subject_classroom_type_relations(subject, parsed_classroom_types)
        return subject

    def update(self, instance, validated_data):
        parsed_careers = validated_data.pop('_parsed_careers', None)
        parsed_teachers = validated_data.pop('_parsed_teachers', None)
        parsed_classroom_types = validated_data.pop('_parsed_classroom_types', None)
        validated_data.pop('careers', None)
        validated_data.pop('teachers', None)
        validated_data.pop('classroom_types', None)

        subject = super().update(instance, validated_data)

        if parsed_careers is not None:
            self._sync_subject_career_relations(subject, parsed_careers)

        if parsed_teachers is not None:
            self._sync_subject_teacher_relations(subject, parsed_teachers)

        if not bool(subject.is_restricted_to_classroom_types):
            self._sync_subject_classroom_type_relations(subject, [])
        elif parsed_classroom_types is not None:
            self._sync_subject_classroom_type_relations(subject, parsed_classroom_types)

        return subject