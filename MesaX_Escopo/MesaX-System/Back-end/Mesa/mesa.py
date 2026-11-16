class Mesa:
    def __init__(self, idMesa, numero, capacidade):
        self.idMesa = idMesa
        self.numero = numero
        self.capacidade = capacidade
        self.situacao = "livre"

    def ocupar(self):
        self.situacao = "ocupada"
        return self.situacao

    def liberar(self):
        self.situacao = "livre"
        return self.situacao

    def consultarSituacao(self):
        return self.situacao