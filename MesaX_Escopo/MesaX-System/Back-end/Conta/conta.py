from datetime import datetime


class Conta:
    def __init__(self, idConta):
        self.idConta = idConta
        self.valorTotal = 0
        self.status = "aberta"
        self.dataAbertura = datetime.now()
        self.dataFechamento = None
        self.pedidos = []

    def adicionarPedido(self, pedido):
        if self.status == "aberta":
            self.pedidos.append(pedido)
            self.calcularTotal()

    def calcularTotal(self):
        self.valorTotal = 0

        for pedido in self.pedidos:
            self.valorTotal += pedido.valorTotal

        return self.valorTotal

    def fecharConta(self):
        self.calcularTotal()
        self.status = "fechada"
        self.dataFechamento = datetime.now()

        return self.valorTotal