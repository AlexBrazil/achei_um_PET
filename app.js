
// ============================================================================
// ARQUIVO DE CONFIGURAÇÃO E LÓGICA PRINCIPAL - app.js
// ============================================================================

// --- 1. CONFIGURAÇÃO DO CLIENTE SUPABASE ---
const SUPABASE_URL = 'https://vfwgxauqlvoeiaziaykl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2d4YXVxbHZvZWlhemlheWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTYxMjksImV4cCI6MjA2MjI3MjEyOX0.vN0Z-MCG1UySu-_2VU7J-aZlZxbID_eHouiahBq4WvM';      
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. SELEÇÃO DE ELEMENTOS DO DOM (HTML) ---
const formCadastro = document.getElementById('form-cadastro');
const fotosInput = document.getElementById('fotos');
const whatsappInput = document.getElementById('whatsapp');
const estadoInput = document.getElementById('estado');
const cidadeInput = document.getElementById('cidade');
const palavraChaveInput = document.getElementById('palavra-chave');
const observacoesInput = document.getElementById('observacoes');
const btnSubmit = document.getElementById('btn-submit');
const loader = document.querySelector('#btn-submit .loader');
const listaPets = document.getElementById('lista-pets');
const filtroEstadoInput = document.getElementById('filtro-estado');
const filtroCidadeInput = document.getElementById('filtro-cidade');
const filtroPalavraChaveInput = document.getElementById('filtro-palavra-chave');
const btnFiltrar = document.getElementById('btn-filtrar');

// --- 3. FUNÇÕES PRINCIPAIS ---

/**
 * Carrega e exibe os pets do banco de dados, com filtros opcionais.
 * ALTERADO: Agora busca apenas pets com status 'encontrado'.
 */
async function carregarPets() {
    listaPets.innerHTML = '<p>Carregando pets...</p>';
    
    const estadoFiltro = filtroEstadoInput.value.trim();
    const cidadeFiltro = filtroCidadeInput.value.trim();
    const palavraChaveFiltro = filtroPalavraChaveInput.value.trim();

    // ALTERAÇÃO IMPORTANTE: Adicionado .eq('status', 'encontrado') para buscar apenas os não devolvidos
    let query = supabaseClient.from('pets_encontrados')
        .select('*')
        .eq('status', 'encontrado') // <<<<<<< NOVA CONDIÇÃO
        .order('created_at', { ascending: false });

    if (estadoFiltro) query = query.ilike('estado', `%${estadoFiltro}%`);
    if (cidadeFiltro) query = query.ilike('cidade', `%${cidadeFiltro}%`);
    if (palavraChaveFiltro) query = query.ilike('palavra_chave', `%${palavraChaveFiltro}%`);

    const { data: pets, error } = await query;

    if (error) {
        console.error('Erro ao buscar pets:', error);
        listaPets.innerHTML = '<p style="color: red;">Erro ao carregar os pets. Tente novamente.</p>';
        return;
    }

    if (pets.length === 0) {
        listaPets.innerHTML = '<p>Nenhum pet encontrado com esses filtros.</p>';
        return;
    }

    listaPets.innerHTML = ''; 
    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        // ALTERAÇÃO: Adicionado o botão "Devolvido ao Dono" com o ID do pet
        petCard.innerHTML = `
            <img src="${pet.fotos_urls[0]}" alt="Foto do PET">
            <div class="pet-card-info">
                <h3>${pet.cidade} - ${pet.estado}</h3>
                <p><strong>Palavras-chave:</strong> ${pet.palavra_chave}</p>
                <p><strong>Observações:</strong> ${pet.observacoes || 'Nenhuma'}</p>
                <a href="https://wa.me/55${pet.whatsapp_contato.replace(/\D/g, '')}" target="_blank" class="whatsapp-btn">Entrar em contato</a>
                <button class="devolvido-btn" data-id="${pet.id}" data-palavra-chave="${pet.palavra_chave}">Devolvido ao Dono</button>
            </div>
        `;
        listaPets.appendChild(petCard);
    });
}

/**
 * Lida com o envio do formulário de cadastro.
 * ALTERADO: Exibe um alerta para o usuário guardar a palavra-chave.
 */
async function handleCadastro(event) {
    event.preventDefault();
    const fotos = fotosInput.files;
    if (fotos.length === 0 || fotos.length > 3) {
        alert('Por favor, selecione de 1 a 3 fotos.');
        return;
    }
    
    btnSubmit.disabled = true;
    loader.classList.remove('hidden');

    try {
        const fotosUrls = [];
        for (const foto of fotos) {
            const nomeArquivo = `${Date.now()}-${foto.name}`;
            const { error: uploadError } = await supabaseClient.storage.from('fotos_pets').upload(nomeArquivo, foto);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabaseClient.storage.from('fotos_pets').getPublicUrl(nomeArquivo);
            fotosUrls.push(publicUrl);
        }
        
        const petData = {
            whatsapp_contato: whatsappInput.value,
            cidade: cidadeInput.value,
            estado: estadoInput.value,
            observacoes: observacoesInput.value,
            fotos_urls: fotosUrls,
            palavra_chave: palavraChaveInput.value,
            status: 'encontrado'
        };

        const { error: insertError } = await supabaseClient.from('pets_encontrados').insert([petData]);
        if (insertError) throw insertError;

        // ALTERAÇÃO: Alerta de sucesso explícito sobre a palavra-chave
        alert(
            'CADASTRO REALIZADO!\n\n' +
            'Guarde bem sua Palavra-chave: "' + palavraChaveInput.value + '"\n\n' +
            'Você precisará dela para marcar o PET como devolvido.'
        );
        
        formCadastro.reset();
        await carregarPets();
    } catch (error) {
        console.error('Erro no processo de cadastro:', error);
        alert(`Ocorreu um erro ao cadastrar: ${error.message}`);
    } finally {
        btnSubmit.disabled = false;
        loader.classList.add('hidden');
    }
}

/**
 * NOVO: Lida com o clique no botão "Devolvido ao Dono".
 * Pede a palavra-chave e atualiza o status do pet no banco.
 */
async function marcarComoDevolvido(petId, palavraChaveCorreta) {
    const palavraChaveDigitada = prompt("Para confirmar a devolução, por favor, digite a palavra-chave deste cadastro:");

    if (palavraChaveDigitada === null) return; // Usuário cancelou

    if (palavraChaveDigitada.trim() === palavraChaveCorreta) {
        // Palavra-chave correta, vamos atualizar o status
        const { error } = await supabaseClient
            .from('pets_encontrados')
            .update({ status: 'devolvido' })
            .eq('id', petId);

        if (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Não foi possível atualizar o status. Tente novamente.');
        } else {
            alert('Status atualizado com sucesso! O pet foi removido da lista.');
            await carregarPets(); // Recarrega a lista para remover o card
        }
    } else {
        // Palavra-chave incorreta
        alert('Palavra-chave incorreta!');
    }
}

// --- 4. EVENT LISTENERS ---
formCadastro.addEventListener('submit', handleCadastro);
btnFiltrar.addEventListener('click', carregarPets);
document.addEventListener('DOMContentLoaded', () => {
    listaPets.innerHTML = '<p>Use os filtros para encontrar um PET.</p>';
});

// NOVO: Listener "delegado" para os botões "Devolvido ao Dono"
listaPets.addEventListener('click', function(event) {
    if (event.target && event.target.matches('button.devolvido-btn')) {
        const petId = event.target.getAttribute('data-id');
        const palavraChave = event.target.getAttribute('data-palavra-chave');
        marcarComoDevolvido(petId, palavraChave);
    }
});