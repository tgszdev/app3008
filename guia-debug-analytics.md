# 🔍 Guia de Debug - Dados dos Gráficos Analytics

## 📋 **Status Atual:**
- ✅ Deploy concluído com logs de debug
- ✅ URL: https://app3008-971i9kcf0-thiagosouzas-projects-b3ccec7c.vercel.app
- ✅ Logs adicionados para investigação

## 🧪 **Como Testar:**

### 1. **Acesse a página Analytics:**
```
https://www.ithostbr.tech/dashboard/analytics
```

### 2. **Abra o Console do Navegador:**
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba "Console"
- Limpe o console (`Ctrl+L`)

### 3. **Teste com Clientes Selecionados:**
1. Selecione um ou mais clientes no seletor
2. Observe os logs no console
3. Verifique se os dados são carregados

## 🔍 **Logs que Você Deve Ver:**

### **Logs de Inicialização:**
```
🔍 DEBUG: Initial useEffect triggered: {
  contextLoading: false,
  isMatrixUser: true,
  isContextUser: false,
  availableContexts: X
}
```

### **Logs de Carregamento de Clientes:**
```
🔍 DEBUG: Matrix user - savedClients: ["client-id-1", "client-id-2"]
🔍 DEBUG: Setting selectedClients from localStorage: ["client-id-1", "client-id-2"]
```

### **Logs de Multi-client:**
```
🔍 DEBUG: Multi-client useEffect triggered: {
  isMultiClient: true,
  selectedClients: ["client-id-1", "client-id-2"],
  periodFilter: "30days",
  myTicketsOnly: false
}
🔍 DEBUG: Fetching multi-client data...
```

### **Logs de API:**
```
🔍 DEBUG: Fetching multi-client data: {
  selectedClients: ["client-id-1", "client-id-2"],
  periodFilter: "30days",
  myTicketsOnly: false,
  params: "context_ids=client-id-1,client-id-2&start_date=2024-12-02&end_date=2025-01-01"
}
```

### **Logs de Resposta:**
```
🔍 DEBUG: Multi-client response: {
  status: 200,
  data: { clients: [...], consolidated: {...} }
}
```

### **Logs de Mapeamento:**
```
🔍 DEBUG: Chart data mapping: {
  isMultiClient: true,
  selectedClients: ["client-id-1", "client-id-2"],
  multiClientData: "Present",
  analyticsData: "Null",
  ticketsTrend: 30,
  statusDistribution: 4,
  priorityDistribution: "Present",
  categoryDistribution: 5,
  peakHours: 24,
  userActivity: 10,
  performanceMetrics: "Present"
}
```

## 🚨 **Possíveis Problemas:**

### **1. Se não aparecer logs:**
- Verifique se está logado
- Verifique se é usuário Matrix
- Verifique se tem clientes disponíveis

### **2. Se aparecer "isMultiClient: false":**
- Verifique se selectedClients não está vazio
- Verifique se localStorage tem dados salvos

### **3. Se aparecer erro na API:**
- Verifique se os context_ids são válidos
- Verifique se as datas estão corretas
- Verifique se o usuário tem permissão

### **4. Se dados estiverem vazios:**
- Verifique se a API retornou dados válidos
- Verifique se o mapeamento está correto
- Verifique se os gráficos estão recebendo os dados

## 📊 **O que Verificar:**

1. **selectedClients** não deve estar vazio
2. **isMultiClient** deve ser `true`
3. **multiClientData** deve estar presente
4. **ticketsTrend** deve ter dados (length > 0)
5. **statusDistribution** deve ter dados (length > 0)
6. **priorityDistribution** deve estar presente
7. **categoryDistribution** deve ter dados (length > 0)

## 🎯 **Próximos Passos:**

Após testar, me informe:
1. Quais logs aparecem no console
2. Se há erros ou warnings
3. Se os dados estão sendo carregados
4. Se os gráficos estão sendo preenchidos

Com essas informações, poderei identificar exatamente onde está o problema e corrigi-lo.

