from rest_framework import serializers
from careers.models import CareerSubjects, Careers
from subjects.models import Subjects

from classrooms.models import ClassroomCareers, ClassroomSubjects, Classrooms


class ClassroomWriteSerializer(serializers.ModelSerializer):
    careers = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
    )
    subjects = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Classrooms
        fields = [
            'name',
            'classroom_type',
            'code',
            'floor',
            'building',
            'building_code',
            'is_restricted',
            'is_restricted_to_subjects',
            'careers',
            'subjects',
        ]

    @staticmethod
    def _validate_binary_flag_value(value):
        if value not in (0, 1):
            raise serializers.ValidationError('Debe ser 0 o 1.')
        return value

    def validate_is_restricted(self, value):
        return self._validate_binary_flag_value(value)

    def validate_is_restricted_to_subjects(self, value):
        return self._validate_binary_flag_value(value)

    def validate_classroom_type(self, classroom_type):
        if classroom_type.is_deleted != 0 or classroom_type.status != 1:
            raise serializers.ValidationError('El tipo de aula no existe o no está disponible.')
        return classroom_type

    def _parse_careers_payload(self, careers_payload):
        parsed_ids = []

        for item in careers_payload:
            if isinstance(item, dict):
                raw_career_id = (
                    item.get('career_id')
                    or item.get('id')
                    or item.get('value')
                )
            else:
                raw_career_id = item

            try:
                career_id = int(raw_career_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'careers': 'Cada carrera debe tener un id valido.'}
                )

            parsed_ids.append(career_id)

        return sorted(set(parsed_ids))

    def _parse_subjects_payload(self, subjects_payload):
        parsed_ids = []

        for item in subjects_payload:
            if isinstance(item, dict):
                raw_subject_id = (
                    item.get('subject_id')
                    or item.get('id')
                    or item.get('value')
                )
            else:
                raw_subject_id = item

            try:
                subject_id = int(raw_subject_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'subjects': 'Cada materia debe tener un id valido.'}
                )

            parsed_ids.append(subject_id)

        return sorted(set(parsed_ids))

    def _sync_classroom_career_relations(self, classroom, parsed_career_ids):
        existing_relations = ClassroomCareers.objects.filter(classrooms=classroom)
        active_relations = existing_relations.filter(is_deleted=0)
        incoming_ids = set(parsed_career_ids)

        for relation in active_relations:
            if relation.careers_id not in incoming_ids:
                relation.is_deleted = 1
                relation.save(update_fields=['is_deleted'])

        for career_id in incoming_ids:
            if active_relations.filter(careers_id=career_id).exists():
                continue

            soft_deleted_relation = existing_relations.filter(
                careers_id=career_id,
                is_deleted=1,
            ).first()

            if soft_deleted_relation:
                soft_deleted_relation.is_deleted = 0
                soft_deleted_relation.save(update_fields=['is_deleted'])
                continue

            ClassroomCareers.objects.create(
                classrooms=classroom,
                careers_id=career_id,
                is_deleted=0,
            )

    def _sync_classroom_subject_relations(self, classroom, parsed_subject_ids):
        existing_relations = ClassroomSubjects.objects.filter(classroom=classroom)
        active_relations = existing_relations.filter(is_deleted=0)
        incoming_ids = set(parsed_subject_ids)

        for relation in active_relations:
            if relation.subject_id not in incoming_ids:
                relation.is_deleted = 1
                relation.save(update_fields=['is_deleted'])

        for subject_id in incoming_ids:
            if active_relations.filter(subject_id=subject_id).exists():
                continue

            soft_deleted_relation = existing_relations.filter(
                subject_id=subject_id,
                is_deleted=1,
            ).first()

            if soft_deleted_relation:
                soft_deleted_relation.is_deleted = 0
                soft_deleted_relation.save(update_fields=['is_deleted'])
                continue

            ClassroomSubjects.objects.create(
                classroom=classroom,
                subject_id=subject_id,
                is_deleted=0,
            )

    def _get_selected_university_id(self):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id and self.instance:
            selected_university_id = self.instance.universities_id
        return selected_university_id

    def _get_effective_restriction_flags(self, attrs):
        current_restricted = bool(self.instance.is_restricted) if self.instance else False
        current_restricted_subjects = bool(self.instance.is_restricted_to_subjects) if self.instance else False

        effective_restricted = bool(
            attrs.get('is_restricted', self.instance.is_restricted if self.instance else 0)
        )
        effective_restricted_subjects = bool(
            attrs.get(
                'is_restricted_to_subjects',
                self.instance.is_restricted_to_subjects if self.instance else 0,
            )
        )

        return (
            current_restricted,
            current_restricted_subjects,
            effective_restricted,
            effective_restricted_subjects,
        )

    def _extract_payload(self, attrs, field_name):
        if field_name in attrs:
            return attrs.get(field_name) or []
        if field_name in self.initial_data:
            return self.initial_data.get(field_name) or []
        return None

    def _parse_and_validate_careers(self, attrs, selected_university_id):
        careers_payload = self._extract_payload(attrs, 'careers')
        if careers_payload is None:
            return None

        parsed_careers = self._parse_careers_payload(careers_payload)

        valid_career_ids = set(
            Careers.objects.filter(
                id__in=parsed_careers,
                university_id=selected_university_id,
                is_deleted=0,
            ).values_list('id', flat=True)
        )

        invalid_career_ids = sorted(set(parsed_careers) - valid_career_ids)
        if invalid_career_ids:
            raise serializers.ValidationError(
                {
                    'careers': (
                        'Las carreras no pertenecen a la universidad seleccionada: '
                        f'{invalid_career_ids}'
                    )
                }
            )

        return parsed_careers

    def _parse_and_validate_subjects(self, attrs, selected_university_id):
        subjects_payload = self._extract_payload(attrs, 'subjects')
        if subjects_payload is None:
            return None

        parsed_subjects = self._parse_subjects_payload(subjects_payload)

        valid_subject_ids = set(
            Subjects.objects.filter(
                id__in=parsed_subjects,
                university_id=selected_university_id,
                is_deleted=0,
            ).values_list('id', flat=True)
        )

        invalid_subject_ids = sorted(set(parsed_subjects) - valid_subject_ids)
        if invalid_subject_ids:
            raise serializers.ValidationError(
                {
                    'subjects': (
                        'Las materias no pertenecen a la universidad seleccionada: '
                        f'{invalid_subject_ids}'
                    )
                }
            )

        return parsed_subjects

    @staticmethod
    def _validate_required_payload_on_activation(
        *,
        is_enabled,
        was_enabled,
        parsed_payload,
        field,
        message,
    ):
        if is_enabled and not was_enabled and parsed_payload is None:
            raise serializers.ValidationError({field: message})

    @staticmethod
    def _validate_non_empty_payload_when_enabled(
        *,
        is_enabled,
        parsed_payload,
        field,
        message,
    ):
        if is_enabled and parsed_payload == []:
            raise serializers.ValidationError({field: message})

    def _resolve_effective_career_ids(self, parsed_careers, selected_university_id):
        if parsed_careers is not None:
            return set(parsed_careers)

        if self.instance:
            return set(
                ClassroomCareers.objects.filter(
                    classrooms=self.instance,
                    is_deleted=0,
                    careers__is_deleted=0,
                    careers__university_id=selected_university_id,
                ).values_list('careers_id', flat=True)
            )

        return set()

    def _validate_subjects_fit_allowed_careers(
        self,
        *,
        parsed_subjects,
        parsed_careers,
        selected_university_id,
        effective_restricted,
        effective_restricted_subjects,
    ):
        if parsed_subjects is None:
            return
        if not effective_restricted or not effective_restricted_subjects:
            return

        effective_career_ids = self._resolve_effective_career_ids(
            parsed_careers,
            selected_university_id,
        )
        if not effective_career_ids:
            raise serializers.ValidationError(
                {
                    'subjects': (
                        'No hay carreras permitidas para validar las materias restringidas.'
                    )
                }
            )

        allowed_subject_ids = set(
            CareerSubjects.objects.filter(
                is_deleted=0,
                careers_id__in=effective_career_ids,
                subjects_id__in=parsed_subjects,
                careers__is_deleted=0,
                careers__university_id=selected_university_id,
                subjects__is_deleted=0,
                subjects__university_id=selected_university_id,
            ).values_list('subjects_id', flat=True)
        )

        disallowed_subject_ids = sorted(set(parsed_subjects) - allowed_subject_ids)
        if disallowed_subject_ids:
            raise serializers.ValidationError(
                {
                    'subjects': (
                        'Las materias no pertenecen a las carreras permitidas del aula: '
                        f'{disallowed_subject_ids}'
                    )
                }
            )

    def validate(self, attrs):
        selected_university_id = self._get_selected_university_id()
        (
            current_restricted,
            current_restricted_subjects,
            effective_restricted,
            effective_restricted_subjects,
        ) = self._get_effective_restriction_flags(attrs)

        parsed_careers = self._parse_and_validate_careers(attrs, selected_university_id)
        parsed_subjects = self._parse_and_validate_subjects(attrs, selected_university_id)

        self._validate_required_payload_on_activation(
            is_enabled=effective_restricted,
            was_enabled=current_restricted,
            parsed_payload=parsed_careers,
            field='careers',
            message='Debes enviar careers al activar is_restricted.',
        )
        self._validate_non_empty_payload_when_enabled(
            is_enabled=effective_restricted,
            parsed_payload=parsed_careers,
            field='careers',
            message='Debes indicar al menos una carrera cuando is_restricted es 1.',
        )
        self._validate_required_payload_on_activation(
            is_enabled=effective_restricted_subjects,
            was_enabled=current_restricted_subjects,
            parsed_payload=parsed_subjects,
            field='subjects',
            message='Debes enviar subjects al activar is_restricted_to_subjects.',
        )
        self._validate_non_empty_payload_when_enabled(
            is_enabled=effective_restricted_subjects,
            parsed_payload=parsed_subjects,
            field='subjects',
            message=(
                'Debes indicar al menos una materia cuando '
                'is_restricted_to_subjects es 1.'
            ),
        )

        self._validate_subjects_fit_allowed_careers(
            parsed_subjects=parsed_subjects,
            parsed_careers=parsed_careers,
            selected_university_id=selected_university_id,
            effective_restricted=effective_restricted,
            effective_restricted_subjects=effective_restricted_subjects,
        )

        if parsed_careers is not None:
            attrs['_parsed_careers'] = parsed_careers

        if parsed_subjects is not None:
            attrs['_parsed_subjects'] = parsed_subjects

        return attrs

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'universities': 'Debe tener una universidad seleccionada primero'}
            )

        parsed_careers = validated_data.pop('_parsed_careers', [])
        parsed_subjects = validated_data.pop('_parsed_subjects', [])
        validated_data.pop('careers', None)
        validated_data.pop('subjects', None)

        validated_data['universities_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        validated_data['is_restricted'] = validated_data.get('is_restricted', 0) or 0
        validated_data['is_restricted_to_subjects'] = (
            validated_data.get('is_restricted_to_subjects', 0) or 0
        )

        classroom = Classrooms.objects.create(**validated_data)

        if classroom.is_restricted:
            self._sync_classroom_career_relations(classroom, parsed_careers)

        if classroom.is_restricted_to_subjects:
            self._sync_classroom_subject_relations(classroom, parsed_subjects)

        return classroom

    def update(self, instance, validated_data):
        parsed_careers = validated_data.pop('_parsed_careers', None)
        parsed_subjects = validated_data.pop('_parsed_subjects', None)
        validated_data.pop('careers', None)
        validated_data.pop('subjects', None)

        classroom = super().update(instance, validated_data)

        if not bool(classroom.is_restricted):
            self._sync_classroom_career_relations(classroom, [])
        elif parsed_careers is not None:
            self._sync_classroom_career_relations(classroom, parsed_careers)

        if not bool(classroom.is_restricted_to_subjects):
            self._sync_classroom_subject_relations(classroom, [])
        elif parsed_subjects is not None:
            self._sync_classroom_subject_relations(classroom, parsed_subjects)

        return classroom

