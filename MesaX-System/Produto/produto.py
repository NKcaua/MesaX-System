class Produto:
    def __init__(
        self,
        idProduto,
        nome,
        descricao,
        preco,
        disponibilidade=True
    ):
        self.idProduto = idProduto
        self.nome = nome
        self.descricao = descricao
        self.preco = preco
        self.disponibilidade = disponibilidade

    def consultar(self):
        return {
            "id": self.idProduto,
            "nome": self.nome,
            "descricao": self.descricao,
            "preco": self.preco,
            "disponibilidade": self.disponibilidade
        }