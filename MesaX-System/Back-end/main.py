from Cliente.cliente import Cliente
from Produto.produto import Produto
from ItemPedido.item_pedido import ItemPedido
from Pedido.pedido import Pedido
from Mesa.mesa import Mesa
from Conta.conta import Conta
from Pagamento.pagamento import Pagamento


mesa = Mesa(
    1,
    5,
    4
)

print("=== MESA ===")
print("Mesa:", mesa.numero)
print("Capacidade:", mesa.capacidade)
print("Situação:", mesa.consultarSituacao())

mesa.ocupar()

print("Nova situação:", mesa.consultarSituacao())


cliente = Cliente(
    1,
    "João",
    mesa
)

print("\n=== CLIENTE ===")
print("Cliente:", cliente.nome)
print("Mesa:", cliente.mesa.numero)


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

print("\n=== CARDÁPIO ===")

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

pedido.atualizarStatus("entregue")


print("\n=== PEDIDO ===")

print(f"{produto.nome} - R$ {produto.preco:.2f}")

print("---")
print(f"Total do pedido: R$ {total:.2f}")
print("Status:", pedido.status)

conta = Conta(1)

conta.adicionarPedido(pedido)

totalConta = conta.calcularTotal()

print("\n=== CONTA ===")
print("Conta:", conta.idConta)
print(f"Valor total: R$ {totalConta:.2f}")
print("Status:", conta.status)


pagamento = Pagamento(
    1,
    totalConta,
    "pix"
)

print("\n=== PAGAMENTO ===")

if pagamento.registrarPagamento():

    print("Pagamento registrado.")
    print("Forma de pagamento:", pagamento.formaPagamento)
    print(f"Valor: R$ {pagamento.valor:.2f}")

    pagamento.confirmarPagamento()

    print("Status:", pagamento.status)

    # Fecha a conta
    conta.fecharConta()

    # Libera a mesa
    mesa.liberar()

else:
    print("Forma de pagamento inválida.")


print("\n=== FINALIZAÇÃO ===")
print("Conta:", conta.status)
print("Pagamento:", pagamento.status)
print("Mesa:", mesa.consultarSituacao())