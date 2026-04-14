from itertools import combinations


def build_empty_adjacency(node_keys: list[str]) -> dict[str, set[str]]:
    """Inicializa el mapa de adyacencia sin aristas."""
    return {node_key: set() for node_key in node_keys}


def connect_all_pairs(adjacency: dict[str, set[str]], node_keys: list[str]) -> None:
    """Conecta completamente una lista de nodos (clique)."""
    for left, right in combinations(node_keys, 2):
        adjacency[left].add(right)
        adjacency[right].add(left)
