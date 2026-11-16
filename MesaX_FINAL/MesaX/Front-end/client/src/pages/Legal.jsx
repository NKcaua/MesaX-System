import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CompanyInfo, LegalLinks, useTitle } from "../components.jsx";
import { company, LEGAL_UPDATED, site } from "../site.js";

function Contact() {
  return company.email ? (
    <a href={`mailto:${company.email}`}>{company.email}</a>
  ) : (
    <>
      o telefone <a href={site.phoneHref}>{site.phone}</a> ou diretamente com a equipe no salão
    </>
  );
}

function Page({ title, children }) {
  useTitle(title);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);
  return (
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link to="/" className="text-sm font-medium text-muted underline underline-offset-4">
        ← Início
      </Link>
      <article className="glass legal mt-5 rounded-[28px] p-6 sm:p-10">
        <p className="eyebrow">Informações legais</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.4rem]">{title}</h1>
        <p className="mt-2 text-sm text-muted">Última atualização: {LEGAL_UPDATED}</p>
        {children}
      </article>
      <LegalLinks center className="mt-6" />
    </main>
  );
}

export function Privacidade() {
  return (
    <Page title="Política de privacidade">
      <p>
        Esta política explica, em linguagem simples, quais dados o sistema do {site.name} trata, para quê, por
        quanto tempo e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD).
      </p>

      <h2>1. Quem é o responsável (controlador)</h2>
      <CompanyInfo className="mt-3" />
      <p>
        Para falar sobre seus dados pessoais, use <Contact />.
      </p>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>
          <strong>Clientes que pedem pela mesa:</strong> o número da mesa, os itens pedidos, os valores, a
          data e a hora do pedido e da conta e a forma de pagamento escolhida (dinheiro, Pix, débito ou
          crédito). <strong>Não pedimos nome, CPF, e-mail, telefone ou endereço</strong> para fazer um pedido.
        </li>
        <li>
          <strong>Equipe (cozinha, garçom, caixa e gerente):</strong> nome de exibição, login e senha
          (guardada de forma protegida, nunca em texto aberto) e um código de sessão temporário.
        </li>
        <li>
          <strong>Dados técnicos:</strong> o servidor pode registrar endereço IP, data, hora e rota acessada,
          apenas para segurança e para corrigir falhas.
        </li>
        <li>
          <strong>Fotos de produtos:</strong> imagens enviadas pelo gerente para o cardápio.
        </li>
      </ul>
      <p>
        <strong>Dados de cartão não passam por este sistema.</strong> O pagamento é feito presencialmente no
        caixa; o sistema registra apenas o valor e a forma de pagamento.
      </p>

      <h2>3. Para que usamos e em que base legal</h2>
      <ul>
        <li>
          Receber, preparar, entregar e cobrar o seu pedido — execução do serviço solicitado (art. 7º, V, da
          LGPD).
        </li>
        <li>
          Guardar registros de vendas e pagamentos e gerar relatórios de gestão — cumprimento de obrigações
          legais, fiscais e contábeis (art. 7º, II) e legítimo interesse na gestão do negócio (art. 7º, IX).
        </li>
        <li>
          Autenticar a equipe e proteger o sistema contra acesso indevido e fraudes — legítimo interesse
          (art. 7º, IX).
        </li>
      </ul>
      <p>Não usamos seus dados para publicidade, perfilamento ou decisões automatizadas.</p>

      <h2 id="cookies">4. Cookies e armazenamento no navegador</h2>
      <p>
        O site <strong>não usa cookies</strong> de publicidade, de análise de audiência ou de rastreamento e
        não carrega scripts, fontes ou imagens de servidores de terceiros. Guardamos no seu navegador somente:
      </p>
      <ul>
        <li>
          <strong>Sessão da equipe</strong> (armazenamento de sessão): mantém o login enquanto a aba está
          aberta e é apagada ao fechá-la ou ao clicar em “Sair”. Essencial para o funcionamento.
        </li>
        <li>
          <strong>Aviso de cookies</strong> (armazenamento local): lembra que você já leu o aviso, para não
          mostrá-lo novamente.
        </li>
      </ul>
      <p>Você pode apagar esses dados a qualquer momento nas configurações do navegador.</p>

      <h2>5. Compartilhamento</h2>
      <p>
        Não vendemos nem compartilhamos dados pessoais para fins de marketing. Os dados podem ser tratados por
        fornecedores de infraestrutura (como hospedagem e banco de dados), que atuam em nosso nome e sob
        nossas instruções, e fornecidos a autoridades quando houver obrigação legal. O site não faz
        transferência internacional por conta própria; se a hospedagem for contratada no exterior,
        informaremos aqui.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <ul>
        <li>
          Pedidos, contas e pagamentos: pelo prazo necessário para cumprir obrigações legais, fiscais e
          contábeis e para a defesa em eventuais processos. Depois disso, são eliminados ou anonimizados.
        </li>
        <li>Dados de login da equipe: enquanto o acesso estiver ativo.</li>
        <li>Código de sessão: até 8 horas ou até o encerramento da sessão.</li>
        <li>Registros técnicos do servidor: pelo tempo necessário para segurança e diagnóstico.</li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Senhas são armazenadas com algoritmo de hash. Relatórios, histórico e alterações de cardápio só
        respondem a usuários com perfil de gerente. Mesmo assim, nenhum sistema é totalmente imune a
        incidentes; se houver risco relevante aos titulares, comunicaremos a Autoridade Nacional de Proteção
        de Dados (ANPD) e os afetados, como a lei determina.
      </p>

      <h2>8. Seus direitos</h2>
      <p>Você pode pedir, a qualquer momento e mediante requisição (art. 18 da LGPD):</p>
      <ul>
        <li>confirmação de que tratamos seus dados e acesso a eles;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>portabilidade dos dados, quando aplicável;</li>
        <li>informação sobre com quem compartilhamos dados;</li>
        <li>revogação de consentimento, quando essa for a base legal, e eliminação dos dados tratados com ele;</li>
        <li>oposição a tratamento feito com base em legítimo interesse.</li>
      </ul>
      <p>
        Para exercer seus direitos, use <Contact />. Como não coletamos dados que identifiquem o cliente do
        salão, talvez seja preciso informar a mesa, a data e o horário para localizarmos um pedido. Se não
        ficar satisfeito, você pode apresentar reclamação à ANPD.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar esta política. A data de revisão fica no topo da página e mudanças relevantes serão
        destacadas no site.
      </p>
    </Page>
  );
}

export function Termos() {
  return (
    <Page title="Termos de serviço">
      <p>
        Ao usar este site e o sistema de pedidos do {site.name}, você concorda com os termos abaixo. Se não
        concordar, procure um atendente no salão.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O sistema permite consultar o cardápio, fazer pedidos pela mesa, acompanhar o andamento do pedido e
        pedir a conta. Há também uma área restrita para a equipe do restaurante (cozinha, garçom, caixa e
        gerente).
      </p>

      <h2>2. Pedidos</h2>
      <ul>
        <li>Ao confirmar, o pedido é enviado à cozinha, vinculado ao número da mesa informada.</li>
        <li>Itens marcados como indisponíveis não podem ser pedidos.</li>
        <li>Depois que a conta é pedida, novos pedidos da mesa ficam bloqueados até o pagamento.</li>
        <li>
          Preços e descrições podem mudar. O valor cobrado é o exibido no momento em que o pedido foi feito.
        </li>
        <li>As fotos do cardápio são ilustrativas.</li>
        <li>
          Cancelamentos, trocas e devoluções seguem a página <Link to="/reembolso">Reembolso e cancelamento</Link>.
        </li>
      </ul>

      <h2>3. Pagamento</h2>
      <p>
        O pagamento é feito presencialmente no caixa (dinheiro, Pix, débito ou crédito). Este site não
        processa pagamentos online nem coleta dados de cartão.
      </p>

      <h2>4. Área da equipe</h2>
      <p>
        O acesso é restrito e pessoal. É proibido compartilhar login e senha ou acessar funções de outro
        perfil. Ações realizadas no sistema podem ser registradas para segurança e auditoria.
      </p>

      <h2>5. Uso adequado</h2>
      <p>
        Não é permitido tentar burlar a segurança, acessar áreas restritas sem autorização, sobrecarregar o
        sistema ou fazer pedidos falsos. O uso indevido pode levar ao bloqueio do acesso, sem prejuízo das
        medidas legais cabíveis.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        Marca, textos, layout e imagens do site pertencem ao {site.name} ou são usados com autorização de
        seus titulares. É vedada a reprodução sem permissão prévia.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Buscamos manter o sistema disponível, mas não garantimos funcionamento ininterrupto. Em caso de
        falha, o atendimento continua normalmente com a equipe no salão.
      </p>

      <h2>8. Responsabilidade e direitos do consumidor</h2>
      <p>
        Nada nestes termos limita os direitos assegurados ao consumidor pelo Código de Defesa do Consumidor
        (Lei nº 8.078/1990).
      </p>

      <h2>9. Privacidade</h2>
      <p>
        O tratamento de dados pessoais está descrito na <Link to="/privacidade">Política de privacidade</Link>.
      </p>

      <h2>10. Alterações, lei aplicável e foro</h2>
      <p>
        Estes termos podem ser atualizados; a data de revisão fica no topo da página. Aplica-se a legislação
        brasileira. O consumidor pode propor ações no foro do seu domicílio.
      </p>

      <h2>11. Contato</h2>
      <CompanyInfo className="mt-3" />
      <p>
        Dúvidas: <Contact />.
      </p>
    </Page>
  );
}

export function Reembolso() {
  return (
    <Page title="Reembolso e cancelamento">
      <p>
        O consumo é no próprio restaurante e o pagamento é feito no caixa. Veja como tratamos cancelamentos,
        trocas e devoluções.
      </p>

      <h2>1. Cancelar um pedido</h2>
      <ul>
        <li>
          Pedido com situação <strong>“Recebido”</strong> (preparo ainda não iniciado): fale com um atendente
          o quanto antes e ele poderá ser cancelado sem cobrança.
        </li>
        <li>
          Pedido <strong>“Em preparo”</strong> ou além: o alimento já está sendo feito, então o cancelamento
          depende da avaliação da equipe, exceto se o erro for nosso.
        </li>
      </ul>

      <h2>2. Pedido errado, com problema ou diferente do pedido</h2>
      <p>
        Se o prato ou a bebida chegar diferente do pedido, com problema de qualidade ou fora das condições
        adequadas, avise a equipe na hora. Conforme o art. 20 do Código de Defesa do Consumidor, você pode
        escolher entre a nova preparação do item, o abatimento proporcional do preço ou a devolução do valor
        pago por ele.
      </p>

      <h2>3. Cobrança errada ou em duplicidade</h2>
      <p>Valores cobrados a mais ou em duplicidade são corrigidos ou devolvidos, mediante conferência da conta.</p>

      <h2>4. Como o valor é devolvido</h2>
      <ul>
        <li>
          <strong>Dinheiro:</strong> devolvido no caixa.
        </li>
        <li>
          <strong>Pix:</strong> devolvido por Pix.
        </li>
        <li>
          <strong>Débito e crédito:</strong> estorno solicitado à operadora do cartão; o prazo para aparecer
          no extrato ou na fatura depende da operadora e do banco emissor.
        </li>
      </ul>

      <h2>5. Como pedir</h2>
      <p>
        Fale com a equipe no salão, no caixa ou use <Contact />. Informe a mesa, a data e o horário do pedido
        para agilizar. Os direitos assegurados pelo Código de Defesa do Consumidor continuam valendo em
        qualquer caso.
      </p>
    </Page>
  );
}
