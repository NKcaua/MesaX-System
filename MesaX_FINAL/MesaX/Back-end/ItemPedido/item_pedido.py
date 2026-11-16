class ItemPedido:
    def __init__(self, idItem, produto, quantidade):
        self.idItem = idItem
        self.produto = produto
        self.quantidade = quantidade
        self.precoUnitario = produto.preco
        self.subtotal = 0

        self.calcularSubtotal()

    def calcularSubtotal(self):
        self.subtotal = self.precoUnitario * self.quantidade
        return self.subtotal

    def alterarQuantidade(self, quantidade):
        self.quantidade = quantidade
        self.calcularSubtotal()