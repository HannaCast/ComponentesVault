from collections import defaultdict

from schedule_generator.generation_logic.graph.models import ScheduleNode
from schedule_generator.generation_logic.graph.schedule_graph import (
    build_empty_adjacency,
    connect_all_pairs,
)

# Construye aristas de conflicto por grupo y por profesor candidato.
def build_schedule_adjacency(nodes: list[ScheduleNode]) -> dict[str, set[str]]:
    """Construye aristas de conflicto por grupo y por profesor candidato."""
    adjacency = build_empty_adjacency([node.node_key for node in nodes])

    grouped_nodes: dict[int, list[str]] = defaultdict(list)
    teacher_nodes: dict[int, list[str]] = defaultdict(list)

    for node in nodes:
        # Conflicto duro: un grupo no puede cursar dos clases al mismo tiempo.
        grouped_nodes[node.group_id].append(node.node_key)

        # Conflicto duro: un profesor no puede impartir dos clases al mismo tiempo.
        for teacher in node.teacher_candidates:
            teacher_nodes[teacher.teacher_id].append(node.node_key)

    # Conecta completamente todos los nodos del mismo grupo.
    for node_keys in grouped_nodes.values():
        connect_all_pairs(adjacency, node_keys)

    # Conecta completamente todos los nodos que comparten profesor candidato.
    for node_keys in teacher_nodes.values():
        unique_keys = list(dict.fromkeys(node_keys))
        connect_all_pairs(adjacency, unique_keys)

    return adjacency
