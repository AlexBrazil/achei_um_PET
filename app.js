// ============================================================================
// ARQUIVO DE LÓGICA PRINCIPAL - app.js (Refatorado para Múltiplas Páginas)
// ============================================================================

// --- 1. CONFIGURAÇÃO DO CLIENTE SUPABASE (GLOBAL) ---
const SUPABASE_URL = 'https://vfwgxauqlvoeiaziaykl.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2d4YXVxbHZvZWlhemlaylsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTYxMjksImV4cCI6MjA2MjI3MjEyOX0.vN0Z-MCG1UySu-_2VU7J-aZlZxbID_eHouiahBq4WvM';      
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. FUNÇÕES GLOBAIS (Podem ser usadas em qualquer página que as necessite) ---

/**
 * Carrega os estados da API do IBGE e preenche um elemento select de estado.
 * @param {HTMLSelectElement} estadoSelectElement - O elemento <select> onde os estados serão adicionados.
 */
async function carregarEstados(estadoSelectElement) {
    if (!estadoSelectElement) return; // Garante que o elemento existe antes de tentar preencher
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if (!response.ok) throw new Error(`Erro HTTP ao carregar estados: ${response.status}`);
        const estados = await response.json();
        // Limpa opções existentes e adiciona as novas
        estadoSelectElement.innerHTML = estadoSelectElement.id === 'filtro-estado' ? '<option value="">Todos os Estados</option>' : '<option value="">Selecione um Estado</option>';
        estados.forEach(estado => {
            estadoSelectElement.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
        });
    } catch (error) {
        console.error("Erro ao carregar estados:", error);
        estadoSelectElement.innerHTML = `<option value="">Erro ao carregar estados</option>`;
    }
}

/**
 * Carrega as cidades de um estado específico da API do IBGE e preenche um elemento select de cidade.
 * @param {string} uf - A sigla do estado (ex: 'SP').
 * @param {HTMLSelectElement} cidadeSelectElement - O elemento <select> onde as cidades serão adicionadas.
 */
async function carregarCidades(uf, cidadeSelectElement) {
    if (!cidadeSelectElement) return; // Garante que o elemento existe

    // Define o placeholder inicial baseado no ID do elemento (filtro ou formulário)
    const placeholderDefault = cidadeSelectElement.id === 'filtro-cidade' ? 'Todas as Cidades' : 'Aguardando estado...';
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


// --- 3. LÓGICA EXECUTADA QUANDO A PÁGINA CARREGA ---
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA ESPECÍFICA DA PÁGINA DE CADASTRO (cadastrar.html) ---
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) { // Verifica se estamos na página de cadastro
        // Seleção de elementos DOM para a página de cadastro
        const fotosInput = document.getElementById('fotos');
        const whatsappInput = document.getElementById('whatsapp');
        const formEstadoSelect = document.getElementById('form-estado');
        const formCidadeSelect = document.getElementById('form-cidade');
        const palavraChaveInput = document.getElementById('palavra-chave');
        const observacoesInput = document.getElementById('observacoes');
        const btnSubmit = document.getElementById('btn-submit');
        const loader = document.querySelector('#btn-submit .loader');

        // Carrega os estados no dropdown do formulário
        carregarEstados(formEstadoSelect);
        
        // Listener para mudança de estado no formulário
        formEstadoSelect.addEventListener('change', () => {
            carregarCidades(formEstadoSelect.value, formCidadeSelect);
        });

        // Máscara do WhatsApp
        whatsappInput.addEventListener('input', (event) => {
            let valor = event.target.value.replace(/\D/g, '');
            if (valor.length > 11) { valor = valor.slice(0, 11); }
            if (valor.length > 10) { valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); } 
            else if (valor.length > 6) { valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); } 
            else if (valor.length > 2) { valor = valor.replace(/^(\d*)/, '($1'); } 
            else { valor = valor.replace(/^(\d*)/, '($1'); }
            event.target.value = valor;
        });

        // Função de cadastro (handleCadastro)
        formCadastro.addEventListener('submit', async (event) => {
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
            if (!formEstadoSelect.value || !formCidadeSelect.value) {
                alert('Por favor, selecione o Estado e a Cidade.');
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
                
                const petData = {
                    whatsapp_contato: whatsappLimpo,
                    cidade: formCidadeSelect.value,
                    estado: formEstadoSelect.value,
                    observacoes: observacoesInput.value,
                    fotos_urls: fotosUrls,
                    palavra_chave: palavraChaveInput.value,
                    status: 'encontrado'
                };

                const { error: insertError } = await supabaseClient.from('pets_encontrados').insert([petData]);
                if (insertError) throw insertError;

                alert(`CADASTRO REALIZADO!\n\nGuarde bem sua Palavra-chave: "${palavraChaveInput.value}"\n\nVocê precisará dela para marcar o PET como devolvido.`);
                
                formCadastro.reset(); // Limpa o formulário
                // Reseta os dropdowns de cidade para o estado inicial
                formCidadeSelect.innerHTML = '<option value="">Aguardando estado...</option>';
                formCidadeSelect.disabled = true;
                // Opcional: recarregar estados para limpar o estado selecionado
                // carregarEstados(formEstadoSelect);
                
                // Na página de cadastro, não precisamos recarregar a lista de pets da consulta.
                // Mas se a lista fosse na mesma página, chamaríamos carregarPets() aqui.

            } catch (error) {
                console.error('Erro detalhado no processo de cadastro:', error);
                alert(`Ocorreu um erro ao cadastrar: ${error.message}. Verifique o console para mais detalhes (F12).`);
            } finally {
                btnSubmit.disabled = false;
                loader.classList.add('hidden');
            }
        });
    } // Fim da lógica da página de cadastro


    // --- LÓGICA ESPECÍFICA DA PÁGINA DE CONSULTA (consultar.html) ---
    const listaPets = document.getElementById('lista-pets');
    if (listaPets) { // Verifica se estamos na página de consulta
        // Seleção de elementos DOM para a página de consulta
        const filtroEstadoSelect = document.getElementById('filtro-estado');
        const filtroCidadeSelect = document.getElementById('filtro-cidade');
        const btnFiltrar = document.getElementById('btn-filtrar');
        // Adicione o filtro de palavra-chave aqui se for usá-lo na consulta
        // const filtroPalavraChaveInput = document.getElementById('filtro-palavra-chave'); 
        
        // Carrega estados nos dropdowns de filtro
        carregarEstados(filtroEstadoSelect);
        
        // Listener para mudança de estado nos filtros
        filtroEstadoSelect.addEventListener('change', () => {
            carregarCidades(filtroEstadoSelect.value, filtroCidadeSelect);
        });
        
        // Função para carregar e exibir os pets (definida aqui para ter acesso aos elementos de filtro)
        const carregarPets = async () => {
            listaPets.innerHTML = '<p>Carregando pets...</p>';
            
            const estadoFiltro = filtroEstadoSelect.value;
            const cidadeFiltro = filtroCidadeSelect.value;
            // const palavraChaveFiltro = filtroPalavraChaveInput ? filtroPalavraChaveInput.value.trim() : ''; // Se o filtro de palavra-chave for adicionado

            let query = supabaseClient.from('pets_encontrados')
                .select('*')
                .eq('status', 'encontrado')
                .order('created_at', { ascending: false });

            if (estadoFiltro) query = query.eq('estado', estadoFiltro);
            if (cidadeFiltro) query = query.eq('cidade', cidadeFiltro);
            // if (palavraChaveFiltro) query = query.ilike('palavra_chave', `%${palavraChaveFiltro}%`); // Se o filtro de palavra-chave for adicionado

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
        };
        
        // Função para marcar como devolvido (definida aqui para ter acesso a carregarPets)
        const marcarComoDevolvido = async (petId, palavraChaveCorreta) => {
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
        };

        btnFiltrar.addEventListener('click', carregarPets);

        // Listener delegado para os botões "Devolvido ao Dono" dentro da lista de pets
        listaPets.addEventListener('click', (event) => {
            if (event.target && event.target.matches('button.devolvido-btn')) {
                const petId = event.target.getAttribute('data-id');
                const palavraChave = event.target.getAttribute('data-palavra-chave');
                marcarComoDevolvido(petId, palavraChave);
            }
        });

        // Carrega os pets inicialmente ao entrar na página de consulta (ou após filtros)
        listaPets.innerHTML = '<p>Selecione o Estado e Cidade para começar a buscar.</p>';
        // carregarPets(); // Descomente esta linha se quiser carregar todos os pets encontrados ao entrar na página de consulta
    } // Fim da lógica da página de consulta

    // A página index.html (menu) não precisa de lógica JavaScript específica.

}); // Fim do DOMContentLoaded