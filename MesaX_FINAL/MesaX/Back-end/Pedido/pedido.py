from datetime import datetime


class Pedido:
    STATUS_VALIDOS = ("recebido", "em_preparo", "pronto", "entregue")

    def __init__(self, idPedido):
        self.idPedido = idPedido
        self.dataHora = datetime.now()
        self.status = "recebido"
        self.valorTotal = 0
        self.itens = []

    def adicionarItem(self, item):
        self.itens.append(item)

    def calcularTotal(self):
        self.valorTotal = 0

        for item in self.itens:
            self.valorTotal += item.subtotal

        return self.valorTotal

    def atualizarStatus(self, novoStatus):
        if novoStatus not in self.STATUS_VALIDOS:
            raise ValueError("Situação de pedido inválida.")

        self.status = novoStatus
