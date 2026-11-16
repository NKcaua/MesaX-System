from Cliente.cliente import Cliente
from Produto.produto import Produto
from ItemPedido.item_pedido import ItemPedido
from Pedido.pedido import Pedido
from Mesa.mesa import Mesa
from Conta.conta import Conta
from Pagamento.pagamento import Pagamento


def escolher_mesa(mesas):
    print("\n=== MESAS DISPONÍVEIS ===")

    for mesa in mesas:
        if mesa.consultarSituacao() == "livre":
            print(f"Mesa {mesa.numero} - capacidade: {mesa.capacidade} pessoas")

    while True:
        try:
            numero = int(input("Escolha o número da mesa: "))

            for mesa in mesas:
                if mesa.numero == numero and mesa.consultarSituacao() == "livre":
                    mesa.ocupar()
                    return mesa

            print("Mesa inválida ou ocupada.")
        except ValueError:
            print("Digite apenas números.")


def fazer_pedido(cliente, produtos):
    cardapio = cliente.acessarCardapio(produtos)
    pedido = Pedido(1)
    id_item = 1

    while True:
        print("\n=== CARDÁPIO ===")

        for produto in cardapio:
            print(f"{produto.idProduto} - {produto.nome} - R$ {produto.preco:.2f}")

        print("0 - Finalizar pedido")

        try:
            opcao = int(input("Escolha o produto: "))
        except ValueError:
            print("Digite apenas números.")
            continue

        if opcao == 0:
            if len(pedido.itens) == 0:
                print("Adicione pelo menos um produto.")
                continue
            break

        produto_escolhido = None

        for produto in cardapio:
            if produto.idProduto == opcao:
                produto_escolhido = produto
                break

        if produto_escolhido is None:
            print("Produto inválido.")
            continue

        try:
            quantidade = int(input("Quantidade: "))
        except ValueError:
            print("Digite apenas números.")
            continue

        if quantidade <= 0:
            print("Quantidade inválida.")
            continue

        item = ItemPedido(id_item, produto_escolhido, quantidade)
        pedido.adicionarItem(item)
        id_item += 1

        print(f"{produto_escolhido.nome} adicionado ao pedido.")

    cliente.realizarPedido(pedido)
    pedido.calcularTotal()

    return pedido


def escolher_pagamento(valor):
    print("\n=== FORMA DE PAGAMENTO ===")
    print("1 - Dinheiro")
    print("2 - Pix")
    print("3 - Débito")
    print("4 - Crédito")

    while True:
        opcao = input("Escolha a forma de pagamento: ")

        if opcao == "1":
            forma = "dinheiro"
        elif opcao == "2":
            forma = "pix"
        elif opcao == "3":
            forma = "debito"
        elif opcao == "4":
            forma = "credito"
        else:
            print("Opção inválida.")
            continue

        return Pagamento(1, valor, forma)


def main():
    mesas = [
        Mesa(1, 1, 4),
        Mesa(2, 2, 4),
        Mesa(3, 3, 6)
    ]

    produtos = [
        Produto(
            1,
            "Bife acebolado",
            "Contrafilé grelhado com cebola, arroz, feijão, batata frita e salada",
            32.90
        ),
        Produto(
            2,
            "Filé de frango grelhado",
            "Peito grelhado, arroz, feijão, farofa e salada da casa",
            29.90
        ),
        Produto(
            3,
            "Refrigerante",
            "Lata 350 ml",
            6.00
        )
    ]

    print("===============================")
    print("     SISTEMA DE RESTAURANTE")
    print("===============================")

    nome = input("\nDigite o nome do cliente: ").strip()

    if nome == "":
        nome = "Cliente"

    mesa = escolher_mesa(mesas)
    cliente = Cliente(1, nome, mesa)

    print(f"\nCliente: {cliente.nome}")
    print(f"Mesa: {cliente.mesa.numero}")

    pedido = fazer_pedido(cliente, produtos)

    print("\n=== RESUMO DO PEDIDO ===")

    for item in pedido.itens:
        print(f"{item.quantidade}x {item.produto.nome} - R$ {item.subtotal:.2f}")

    print(f"Total: R$ {pedido.valorTotal:.2f}")

    pedido.atualizarStatus("entregue")

    conta = Conta(1)
    conta.adicionarPedido(pedido)

    pagamento = escolher_pagamento(conta.valorTotal)

    if pagamento.registrarPagamento():
        pagamento.confirmarPagamento()
        conta.fecharConta()
        mesa.liberar()

        print("\n=== FINALIZAÇÃO ===")
        print("Pedido:", pedido.status)
        print("Pagamento:", pagamento.formaPagamento)
        print("Status do pagamento:", pagamento.status)
        print(f"Valor pago: R$ {pagamento.valor:.2f}")
        print("Conta:", conta.status)
        print("Mesa:", mesa.consultarSituacao())
        print("Atendimento finalizado com sucesso.")


if __name__ == "__main__":
    main()
