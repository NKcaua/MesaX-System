from datetime import datetime

class Pedido:
    def __init__(self, idPedido):
        self.idPedido = idPedido
        self.dataHora = datetime.now()
        self.status = "aberto"
        self.valorTotal = 0
        self.itens = []

    def criarPedido(self):
        self.status = "aberto"

    def adicionarItem(self, item):
        self.itens.append(item)
        self.calcularTotal()

    def calcularTotal(self):
        self.valorTotal = 0

        for item in self.itens:
            self.valorTotal += item.subtotal

        return self.valorTotal

    def atualizarStatus(self, novoStatus):
        self.status = novoStatus