# 🔧 Solução para Erro de Instalação do better-sqlite3

## Problema
O `better-sqlite3` requer Python 3.6+ e ferramentas de build nativas (node-gyp) para compilar no Windows.

## ✅ Solução Recomendada: Instalar Python e Build Tools

### Passo 1: Instalar Python

1. **Baixe o Python 3.11 ou superior:**
   - Acesse: https://www.python.org/downloads/
   - Baixe a versão mais recente (3.11 ou 3.12)

2. **Durante a instalação, IMPORTANTE:**
   - ✅ Marque a opção **"Add Python to PATH"**
   - ✅ Marque a opção **"Install launcher for all users"**

3. **Verifique a instalação:**
   ```powershell
   python --version
   ```

### Passo 2: Instalar Visual Studio Build Tools

O `better-sqlite3` precisa das ferramentas de compilação do Windows:

1. **Baixe o Visual Studio Build Tools:**
   - Acesse: https://visualstudio.microsoft.com/downloads/
   - Role até "Tools for Visual Studio"
   - Baixe **"Build Tools for Visual Studio 2022"**

2. **Durante a instalação:**
   - Selecione a carga de trabalho **"Desktop development with C++"**
   - Isso instala o compilador C++ necessário

### Passo 3: Configurar npm para usar Python

```powershell
# Configure o npm para usar o Python instalado
npm config set python "C:\Users\GABRIEL-SUP\AppData\Local\Programs\Python\Python311\python.exe"

# Ou se o Python estiver no PATH:
npm config set python python
```

### Passo 4: Limpar e Reinstalar

```powershell
cd C:\Users\GABRIEL-SUP\Desktop\Projetos\Api-FoodDidDo

# Limpar cache e node_modules
npm cache clean --force
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# Reinstalar
npm install
```

---

## 🚀 Solução Alternativa: Usar versão pré-compilada

Se você não quiser instalar Python e Build Tools, pode tentar usar uma versão pré-compilada:

```powershell
cd C:\Users\GABRIEL-SUP\Desktop\Projetos\Api-FoodDidDo

# Limpar tudo
npm cache clean --force
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# Instalar com flag para usar binários pré-compilados
npm install --build-from-source=false better-sqlite3

# Depois instalar o resto
npm install
```

---

## 🔄 Solução Rápida: Usar node-gyp globalmente

Se você já tem Python instalado mas não está sendo encontrado:

```powershell
# Instalar node-gyp globalmente
npm install -g node-gyp

# Configurar Python manualmente
npm config set python "C:\Caminho\Para\Python\python.exe"

# Tentar instalar novamente
npm install
```

---

## ⚠️ Verificação de Problemas

### Verificar se Python está no PATH:
```powershell
python --version
```

### Verificar configuração do npm:
```powershell
npm config get python
```

### Verificar versão do Node.js:
```powershell
node --version
```

### Verificar se node-gyp está instalado:
```powershell
node-gyp --version
```

---

## 📝 Notas Importantes

1. **Python 3.6+ é obrigatório** - versões anteriores não funcionam
2. **Build Tools são necessárias** - o Visual Studio Build Tools instala o compilador C++
3. **PATH do Python** - certifique-se de que o Python está no PATH do sistema
4. **Reinicie o terminal** - após instalar Python, feche e reabra o PowerShell

---

## 🆘 Se Nada Funcionar

Como último recurso, você pode usar uma alternativa ao `better-sqlite3`:

1. **sql.js** - SQLite em JavaScript puro (mais lento, mas não requer compilação)
2. **sqlite3** - alternativa mais antiga (pode ter os mesmos problemas)
3. **Usar PostgreSQL** - você já tem `pg` instalado, pode migrar para PostgreSQL

---

## ✅ Verificação Final

Após seguir os passos, verifique se funcionou:

```powershell
npm install
# Deve instalar sem erros

# Teste se o módulo funciona
node -e "const Database = require('better-sqlite3'); console.log('OK!');"
```
