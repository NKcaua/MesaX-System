from Cliente.cliente import Cliente
from Produto.produto import Produto
from ItemPedido.item_pedido import ItemPedido
from Pedido.pedido import Pedido

cliente = Cliente(
    1,
    "João",
    "Mesa 5"
)

produto1 = Produto(
    1,
    "Bife acebolado",
    "Contrafilé grelhado com cebola, arroz, feijão, batata frita e salada",
    32.90
)

produto2 = Produto(
    2,
    "Filé de frango grelhado",
    "Peito grelhado, arroz, feijão, farofa e salada da casa.",
    29.90
)

produtos = [
    produto1,
    produto2
]


cardapio = cliente.acessarCardapio(produtos)


print("CARDÁPIO")

for produto in cardapio:
    print(
        produto.nome,
        "- R$",
        produto.preco
    )


pedido = Pedido(1)

item1 = ItemPedido(
    1,
    produto1,
    2
)

item2 = ItemPedido(
    2,
    produto2,
    1
)

pedido.adicionarItem(item1)
pedido.adicionarItem(item2)

cliente.realizarPedido(pedido)

total = pedido.calcularTotal()


pedido.atualizarStatus("finalizado")


print("\nPEDIDO")

for item in pedido.itens:
    print(
        item.produto.nome,
        "- Quantidade:",
        item.quantidade,
        "- Subtotal: R$",
        item.subtotal
    )

print("---")
print("Total: R$", total)
print("Status:", pedido.status)