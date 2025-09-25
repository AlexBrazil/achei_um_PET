// ============================================================================
// ARQUIVO COMPLETO E CORRIGIDO - app.js
// ============================================================================

// --- 1. CONFIGURAÇÃO DO CLIENTE SUPABASE ---
const SUPABASE_URL = 'https://vfwgxauqlvoeiaziaykl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2d4YXVxbHZvZWlhemlheWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTYxMjksImV4cCI6MjA2MjI3MjEyOX0.vN0Z-MCG1UySu-_2VU7J-aZlZxbID_eHouiahBq4WvM';      
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. SELEÇÃO DE ELEMENTOS DO DOM (HTML) ---
const formCadastro = document.getElementById('form-cadastro');
const fotosInput = document.getElementById('fotos');
const whatsappInput = document.getElementById('whatsapp');
const formEstadoSelect = document.getElementById('form-estado');
const formCidadeSelect = document.getElementById('form-cidade');
const palavraChaveInput = document.getElementById('palavra-chave');
const observacoesInput = document.getElementById('observacoes');
const btnSubmit = document.getElementById('btn-submit');
const loader = document.querySelector('#btn-submit .loader');
const listaPets = document.getElementById('lista-pets');
const filtroEstadoSelect = document.getElementById('filtro-estado');
const filtroCidadeSelect = document.getElementById('filtro-cidade');
const btnFiltrar = document.getElementById('btn-filtrar');

// --- 3. FUNÇÕES PRINCIPAIS ---

async function carregarEstados() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const estados = await response.json();
        estados.forEach(estado => {
            formEstadoSelect.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
            filtroEstadoSelect.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
        });
    } catch (error) { console.error("Erro ao carregar estados:", error); }
}

async function carregarCidades(uf, selectElement) {
    if (!uf) {
        selectElement.innerHTML = selectElement.id === 'filtro-cidade' ? '<option value="">Todas as Cidades</option>' : '<option value="">Aguardando estado...</option>';
        selectElement.disabled = true;
        return;
    }
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Carregando...</option>';
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const cidades = await response.json();
        selectElement.innerHTML = selectElement.id === 'filtro-cidade' ? '<option value="">Todas as Cidades</option>' : '<option value="">Selecione uma Cidade</option>';
        cidades.forEach(cidade => {
            selectElement.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`;
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function carregarPets() {
    listaPets.innerHTML = '<p>Carregando pets...</p>';
    const estadoFiltro = filtroEstadoSelect.value;
    const cidadeFiltro = filtroCidadeSelect.value;
    let query = supabaseClient.from('pets_encontrados').select('*').eq('status', 'encontrado').order('created_at', { ascending: false });
    if (estadoFiltro) query = query.eq('estado', estadoFiltro);
    if (cidadeFiltro) query = query.eq('cidade', cidadeFiltro);
    const { data: pets, error } = await query;
    if (error) { console.error('Erro ao buscar pets:', error); return; }
    if (pets.length === 0) { listaPets.innerHTML = '<p>Nenhum pet encontrado com esses filtros.</p>'; return; }
    listaPets.innerHTML = ''; 
    pets.forEach(pet => {
        const fotoUrl = (pet.fotos_urls && pet.fotos_urls.length > 0) ? pet.fotos_urls[0] : 'https://via.placeholder.com/300x200?text=Sem+Foto';
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.innerHTML = `
            <img src="${fotoUrl}" alt="Foto do PET">
            <div class="pet-card-info">
                <h3>${pet.cidade} - ${pet.estado}</h3>
                <p><strong>Observações:</strong> ${pet.observacoes || 'Nenhuma'}</p>
                <a href="https://wa.me/55${pet.whatsapp_contato.replace(/\D/g, '')}" target="_blank" class="whatsapp-btn">Entrar em contato</a>
                <button class="devolvido-btn" data-id="${pet.id}" data-palavra-chave="${pet.palavra_chave}">Devolvido ao Dono</button>
            </div>
        `;
        listaPets.appendChild(petCard);
    });
}

async function handleCadastro(event) {
    event.preventDefault();
    const whatsappLimpo = whatsappInput.value.replace(/\D/g, '');
    if (whatsappLimpo.length < 10 || whatsappLimpo.length > 11) {
        alert('Por favor, insira um número de WhatsApp válido com DDD (10 ou 11 dígitos).');
        return;
    }
    const fotos = fotosInput.files;
    if (fotos.length === 0 || fotos.length > 3) {
        alert('Por favor, selecione de 1 a 3 fotos.');
        return;
    }
    
    btnSubmit.disabled = true;
    loader.classList.remove('hidden');

    try {
        // --- CÓDIGO RESTAURADO ---
        const fotosUrls = [];
        for (const foto of fotos) {
            const nomeArquivo = `${Date.now()}-${foto.name}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('fotos_pets')
                .upload(nomeArquivo, foto);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseClient.storage
                .from('fotos_pets')
                .getPublicUrl(nomeArquivo);

            fotosUrls.push(publicUrl);
        }
        // --- FIM DO CÓDIGO RESTAURADO ---
        
        const petData = {
            whatsapp_contato: whatsappLimpo,
            cidade: formCidadeSelect.value,
            estado: formEstadoSelect.value,
            observacoes: observacoesInput.value,
            fotos_urls: fotosUrls, // Agora este array terá as URLs das fotos
            palavra_chave: palavraChaveInput.value,
            status: 'encontrado'
        };

        const { error: insertError } = await supabaseClient.from('pets_encontrados').insert([petData]);
        if (insertError) throw insertError;

        alert(`CADASTRO REALIZADO!\n\nGuarde bem sua Palavra-chave: "${palavraChaveInput.value}"\n\nVocê precisará dela para marcar o PET como devolvido.`);
        
        formCadastro.reset();
        formCidadeSelect.innerHTML = '<option value="">Aguardando estado...</option>';
        formCidadeSelect.disabled = true;
        
        await carregarPets();
    } catch (error) {
        console.error('Erro detalhado no processo de cadastro:', error);
        alert(`Ocorreu um erro ao cadastrar: ${error.message}. Verifique o console para mais detalhes (F12).`);
    } finally {
        btnSubmit.disabled = false;
        loader.classList.add('hidden');
    }
}

async function marcarComoDevolvido(petId, palavraChaveCorreta) {
    const palavraChaveDigitada = prompt("Para confirmar a devolução, por favor, digite a palavra-chave deste cadastro:");
    if (palavraChaveDigitada === null) return;
    if (palavraChaveDigitada.trim() === palavraChaveCorreta) {
        const { error } = await supabaseClient.from('pets_encontrados').update({ status: 'devolvido' }).eq('id', petId);
        if (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Não foi possível atualizar o status. Tente novamente.');
        } else {
            alert('Status atualizado com sucesso! O pet foi removido da lista.');
            await carregarPets();
        }
    } else {
        alert('Palavra-chave incorreta!');
    }
}

// --- 4. EVENT LISTENERS ---
formCadastro.addEventListener('submit', handleCadastro);
btnFiltrar.addEventListener('click', carregarPets);
listaPets.addEventListener('click', function(event) {
    if (event.target && event.target.matches('button.devolvido-btn')) {
        const petId = event.target.getAttribute('data-id');
        const palavraChave = event.target.getAttribute('data-palavra-chave');
        marcarComoDevolvido(petId, palavraChave);
    }
});
whatsappInput.addEventListener('input', (event) => {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) { valor = valor.slice(0, 11); }
    if (valor.length > 10) { valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); } 
    else if (valor.length > 6) { valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); } 
    else if (valor.length > 2) { valor = valor.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2'); } 
    else { valor = valor.replace(/^(\d*)/, '($1'); }
    event.target.value = valor;
});
document.addEventListener('DOMContentLoaded', () => {
    listaPets.innerHTML = '<p>Use os filtros para encontrar um PET.</p>';
    carregarEstados();
});
formEstadoSelect.addEventListener('change', () => {
    carregarCidades(formEstadoSelect.value, formCidadeSelect);
});
filtroEstadoSelect.addEventListener('change', () => {
    carregarCidades(filtroEstadoSelect.value, filtroCidadeSelect);
});