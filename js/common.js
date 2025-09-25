// ============================================================================
// ARQUIVO DE CÓDIGO COMUM (common.js)
// ============================================================================

// --- 1. CONFIGURAÇÃO DO CLIENTE SUPABASE (GLOBAL) ---
const SUPABASE_URL = 'https://vfwgxauqlvoeiaziaykl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2d4YXVxbHZvZWlhemlheWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTYxMjksImV4cCI6MjA2MjI3MjEyOX0.vN0Z-MCG1UySu-_2VU7J-aZlZxbID_eHouiahBq4WvM';      
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. FUNÇÕES GLOBAIS (Podem ser usadas em qualquer página que as necessite) ---

async function carregarEstados(estadoSelectElement) {
    if (!estadoSelectElement) return;
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if (!response.ok) throw new Error(`Erro HTTP ao carregar estados: ${response.status}`);
        const estados = await response.json();
        estadoSelectElement.innerHTML = estadoSelectElement.id === 'filtro-estado' ? '<option value="">Todos os Estados</option>' : '<option value="">Selecione um Estado</option>';
        estados.forEach(estado => {
            estadoSelectElement.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
        });
    } catch (error) {
        console.error("Erro ao carregar estados:", error);
        estadoSelectElement.innerHTML = `<option value="">Erro ao carregar estados</option>`;
    }
}

async function carregarCidades(uf, cidadeSelectElement) {
    if (!cidadeSelectElement) return;
    const placeholderDefault = cidadeSelectElement.id === 'filtro-cidade' ? 'Todos as Cidades' : 'Aguardando estado...';
    const placeholderSelecionar = cidadeSelectElement.id === 'filtro-cidade' ? 'Todas as Cidades' : 'Selecione uma Cidade';
    if (!uf) {
        cidadeSelectElement.innerHTML = `<option value="">${placeholderDefault}</option>`;
        cidadeSelectElement.disabled = true;
        return;
    }
    cidadeSelectElement.disabled = true;
    cidadeSelectElement.innerHTML = '<option value="">Carregando...</option>';
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        if (!response.ok) throw new Error(`Erro HTTP ao carregar cidades: ${response.status}`);
        const cidades = await response.json();
        cidadeSelectElement.innerHTML = `<option value="">${placeholderSelecionar}</option>`;
        cidades.forEach(cidade => {
            cidadeSelectElement.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`;
        });
        cidadeSelectElement.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        cidadeSelectElement.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}