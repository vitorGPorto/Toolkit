# 🧰 RM TOOLKIT

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)
![Tech](https://img.shields.io/badge/tech-Electron%20%7C%20React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)

O **RM TOOLKIT** é uma central de comando avançada para desenvolvedores, consultores e administradores do ecossistema **TOTVS RM ERP**. Projetado para substituir ferramentas legadas, ele oferece uma interface moderna, rápida e repleta de automações que simplificam o gerenciamento de ambientes complexos.

---

## ✨ Funcionalidades Completas

### 👤 Gestão de Perfis (Environments)
- **Criação e Persistência**: Salve múltiplas configurações de ambiente (Banco, Usuário, Versão RM) e alterne entre elas instantaneamente.
- **Ambiente Ativo**: Seletor rápido na home com feedback visual (destaque em verde) para o perfil carregado.
- **Atalho de Adição**: Botão "+" direto no seletor para configurar novos ambientes rapidamente.

### 🚀 Controle de Processos RM
- **RM.exe**: Início rápido com suporte a **Auto Login** (bypass de autenticação).
- **RM.Host.exe**: Inicialização monitorada com logs em tempo real filtrados (esconde avisos irrelevantes).
- **Portal Aluno**: Atalho direto para o portal educacional.
- **Finalização Forçada**: Botão "Fechar" para encerrar processos RM travados com segurança.

### 🛠️ Atalhos de Pastas e Arquivos
- **Acesso Rápido**: Abertura direta das pastas `Bin` e `Custom` de acordo com a versão do RM selecionada.
- **Gerenciar Aliases**: Interface dedicada para configurar strings de conexão de banco de dados.
- **Limpeza de DII**: Botão para apagar arquivos `.dii` da pasta Custom de forma automatizada.

### ⚡ Ações Rápidas (Power Actions)
- **Reiniciar IIS**: Executa o comando `iisreset` de forma transparente.
- **Gerenciador IIS**: Atalho direto para abrir as configurações do Internet Information Services (`inetmgr`).
- **Reciclar AppPool**: Reciclagem rápida do Pool de Aplicativos padrão.
- **Limpar Temp**: Faxina profunda no cache de arquivos temporários do Windows.
- **Atualizar Bin**: Fluxo simplificado para deploy de artefatos.

### 🔍 Inteligência e Conexão
- **Teste de Rede Real**: Validação de conectividade TCP com o banco de dados (SQL Server ou Oracle) com feedback de porta e IP.
- **Filtro de Versão Dinâmico**: O sistema só lista Aliases compatíveis com a versão do RM selecionada, evitando erros de inicialização.
- **Gestão de Alias.dat**: Geração automática e dinâmica do arquivo de configuração de banco na pasta de execução.

### ⚙️ Configurações e Customização
- **Preferências**: Auto Login, Deletar Broker automaticamente, Logs Verbose e Limpeza de Host.
- **Multi-idioma**: Interface 100% traduzida para Português (PT) e Inglês (EN).
- **Design Premium**: Interface em Dark Mode com bordas arredondadas e ícones Lucide.

---

## 🛠️ Tecnologias Utilizadas

- **Shell**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilo**: CSS Vanilla (Modern Layout)
- **Comunicação**: IPC (Inter-Process Communication) nativo para comandos Windows.

---

## 🚀 Como Iniciar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada)

### Instalação e Execução

> **Importante:** Todos os comandos devem ser executados dentro da pasta `TOOLKIT`.

1. Entre na pasta do projeto:
   ```bash
   cd TOOLKIT
   ```
2. Instale as dependências (apenas na primeira vez):
   ```bash
   npm install
   ```
3. Inicie o TOOLKIT em modo de desenvolvimento:
   ```bash
   npm run totvs
   ```
4. Para gerar o executável (`.exe`):
   ```bash
   npm run build
   ```

---

## 📄 Licença
Este projeto é de uso restrito e otimizado para o ecossistema TOTVS RM.

---
<p align="center">
  Desenvolvido com ❤️ para a comunidade TOTVS RM.
</p>
