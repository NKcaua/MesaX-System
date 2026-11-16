class Produto:
    CATEGORIAS = ("executivo", "bebida")

    def __init__(
        self,
        idProduto,
        nome,
        descricao,
        preco,
        disponibilidade=True,
        categoria="executivo",
        imagem=None
    ):
        self.idProduto = idProduto
        self.nome = nome
        self.descricao = descricao
        self.preco = preco
        self.disponibilidade = disponibilidade
        self.categoria = categoria
        self.imagem = imagem

    def consultar(self):
        return {
            "id": self.idProduto,
            "nome": self.nome,
            "descricao": self.descricao,
            "preco": self.preco,
            "disponibilidade": self.disponibilidade
        }

    def atualizar(self, nome, descricao, preco):
        """Altera nome, descrição e preço (usado pelo gerente)."""
        nome = str(nome or "").strip()
        descricao = str(descricao or "").strip()

        if not nome:
            raise ValueError("Informe o nome do produto.")
        if len(nome) > 80:
            raise ValueError("Nome muito longo (máx. 80 caracteres).")
        if len(descricao) > 300:
            raise ValueError("Descrição muito longa (máx. 300 caracteres).")

        try:
            preco = float(preco)
        except (TypeError, ValueError):
            preco = 0

        if not 0 < preco <= 9999:
            raise ValueError("Informe um preço válido (maior que zero).")

        self.nome = nome
        self.descricao = descricao
        self.preco = round(preco, 2)

    def alterarDisponibilidade(self, disponivel):
        self.disponibilidade = bool(disponivel)
        return self.disponibilidade
