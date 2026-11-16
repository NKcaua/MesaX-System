from datetime import datetime


class Pagamento:
    def __init__(self, idPagamento, valor, formaPagamento):
        self.idPagamento = idPagamento
        self.valor = valor
        self.data = datetime.now()
        self.formaPagamento = formaPagamento
        self.status = "pendente"

    def registrarPagamento(self):
        formasValidas = [
            "dinheiro",
            "pix",
            "debito",
            "credito",
        ]

        if self.formaPagamento.lower() in formasValidas:
            self.status = "registrado"
            return True

        return False

    def confirmarPagamento(self):
        if self.status == "registrado":
            self.status = "confirmado"
            return True

        return False

    def consultarPagamento(self):
        return {
            "id": self.idPagamento,
            "valor": self.valor,
            "data": self.data,
            "formaPagamento": self.formaPagamento,
            "status": self.status
        }
