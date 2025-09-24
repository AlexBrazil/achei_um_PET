// ============================================================================
// ARQUIVO DE CONFIGURAÇÃO E LÓGICA PRINCIPAL - app.js
// ============================================================================

// --- 1. CONFIGURAÇÃO DO CLIENTE SUPABASE ---
const SUPABASE_URL = 'https://vfwgxauqlvoeiaziaykl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2d4YXVxbHZvZWlhemlheWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTYxMjksImV4cCI6MjA2MjI3MjEyOX0.vN0Z-MCG1UySu-_2VU7J-aZlZxbID_eHouiahBq4WvM';      


// Cria a instância do cliente Supabase para ser usada em todo o script.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// --- 2. SELEÇÃO DE ELEMENTOS DO DOM (HTML) ---
// Seleciona todos os elementos interativos da página para que possamos usá-los no JavaScript.
const formCadastro = document.getElementById('form-cadastro');
const fotosInput = document.getElementById('fotos');
const whatsappInput = document.getElementById('whatsapp');
const estadoInput = document.getElementById('estado');
const cidadeInput = document.getElementById('cidade');
const palavraChaveInput = document.getElementById('palavra-chave'); // NOVO CAMPO
const observacoesInput = document.getElementById('observacoes');
const btnSubmit = document.getElementById('btn-submit');
const loader = document.querySelector('#btn-submit .loader');

const listaPets = document.getElementById('lista-pets');
const filtroEstadoInput = document.getElementById('filtro-estado');
const filtroCidadeInput = document.getElementById('filtro-cidade');
const filtroPalavraChaveInput = document.getElementById('filtro-palavra-chave'); // NOVO FILTRO
const btnFiltrar = document.getElementById('btn-filtrar');


// --- 3. FUNÇÕES PRINCIPAIS ---

/**
 * Carrega e exibe os pets do banco de dados, com filtros opcionais.
 */
async function carregarPets() {
    listaPets.innerHTML = '<p>Carregando pets...</p>';
    
    const estadoFiltro = filtroEstadoInput.value.trim();
    const cidadeFiltro = filtroCidadeInput.value.trim();
    const palavraChaveFiltro = filtroPalavraChaveInput.value.trim(); // NOVO FILTRO

    // Inicia a construção da query no Supabase
    let query = supabaseClient.from('pets_encontrados').select('*').order('created_at', { ascending: false });

    // Adiciona filtros à query se os campos estiverem preenchidos
    if (estadoFiltro) {
        query = query.ilike('estado', `%${estadoFiltro}%`);
    }
    if (cidadeFiltro) {
        query = query.ilike('cidade', `%${cidadeFiltro}%`);
    }
    if (palavraChaveFiltro) {
        query = query.ilike('palavra_chave', `%${palavraChaveFiltro}%`); // FILTRO POR PALAVRA-CHAVE
    }

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

    // Limpa a lista e renderiza os cards dos pets
    listaPets.innerHTML = ''; 
    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.innerHTML = `
            <img src="${pet.fotos_urls[0]}" alt="Foto do PET">
            <div class="pet-card-info">
                <h3>${pet.cidade} - ${pet.estado}</h3>
                <p><strong>Palavras-chave:</strong> ${pet.palavra_chave}</p>
                <p><strong>Observações:</strong> ${pet.observacoes || 'Nenhuma'}</p>
                <a href="https://wa.me/55${pet.whatsapp_contato.replace(/\D/g, '')}" target="_blank">Entrar em contato</a>
            </div>
        `;
        listaPets.appendChild(petCard);
    });
}

/**
 * Lida com o envio do formulário de cadastro.
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
            const { error: uploadError } = await supabaseClient.storage
                .from('fotos_pets')
                .upload(nomeArquivo, foto);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('fotos_pets')
                .getPublicUrl(nomeArquivo);

            fotosUrls.push(publicUrl);
        }
        
        // Objeto de inserção com os NOVOS CAMPOS
        const petData = {
            whatsapp_contato: whatsappInput.value,
            cidade: cidadeInput.value,
            estado: estadoInput.value,
            observacoes: observacoesInput.value,
            fotos_urls: fotosUrls,
            palavra_chave: palavraChaveInput.value, // DADO DO NOVO CAMPO
            status: 'encontrado' // VALOR PADRÃO DEFINIDO AQUI
        };

        const { error: insertError } = await supabaseClient.from('pets_encontrados').insert([petData]);

        if (insertError) {
            throw insertError;
        }

        alert('PET cadastrado com sucesso!');
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


// --- 4. EVENT LISTENERS ---

formCadastro.addEventListener('submit', handleCadastro);
btnFiltrar.addEventListener('click', carregarPets);
document.addEventListener('DOMContentLoaded', () => {
    // Para não carregar todos os pets inicialmente, deixamos a lista vazia
    listaPets.innerHTML = '<p>Use os filtros para encontrar um PET.</p>';
});