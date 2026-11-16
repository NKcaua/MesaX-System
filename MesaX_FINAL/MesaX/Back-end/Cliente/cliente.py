class Cliente:
    def __init__(self, idCliente, nome, mesa=None):
        self.idCliente = idCliente
        self.nome = nome
        self.mesa = mesa

    def acessarCardapio(self, produtos):
        produtosDisponiveis = []

        for produto in produtos:
            if produto.disponibilidade:
                produtosDisponiveis.append(produto)

        return produtosDisponiveis

    def realizarPedido(self, pedido):
        return pedido

    def consultarPedido(self, pedido):
        return pedido.status