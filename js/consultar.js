// ============================================================================
// ARQUIVO DE LÓGICA DA PÁGINA DE CONSULTA (consultar.js)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const listaPets = document.getElementById('lista-pets');
    if (!listaPets) return; // Se não estiver na página de consulta, para a execução

    // --- SELEÇÃO DE ELEMENTOS (FILTROS E MODAL DE FOTOS) ---
    const filtroEstadoSelect = document.getElementById('filtro-estado');
    const filtroCidadeSelect = document.getElementById('filtro-cidade');
    const btnFiltrar = document.getElementById('btn-filtrar');
    
    // Elementos da nova modal de fotos
    const modalFotosOverlay = document.getElementById('modal-fotos-overlay');
    const modalFotosCloseBtn = document.getElementById('modal-fotos-close-btn');
    const carouselImage = document.getElementById('carousel-image');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    // --- VARIÁVEIS DE ESTADO PARA O CARROSSEL ---
    let petsCarregados = []; // Armazena os dados dos pets da busca atual
    let fotosAtuais = [];    // Armazena as URLs das fotos do pet selecionado na modal
    let indiceFotoAtual = 0; // Armazena o índice da foto sendo exibida na modal

    // --- FUNÇÕES DA MODAL E CARROSSEL ---
    const abrirModalFotos = (petId) => {
        // Encontra o pet clicado na lista de pets já carregados
        const petSelecionado = petsCarregados.find(pet => pet.id === petId);
        if (!petSelecionado || !petSelecionado.fotos_urls) return;

        fotosAtuais = petSelecionado.fotos_urls;
        indiceFotoAtual = 0;
        mostrarFoto(indiceFotoAtual);
        modalFotosOverlay.classList.remove('hidden');
    };

    const fecharModalFotos = () => {
        modalFotosOverlay.classList.add('hidden');
        fotosAtuais = []; // Limpa o array para a próxima vez
    };

    const mostrarFoto = (indice) => {
        carouselImage.src = fotosAtuais[indice];
        // Esconde ou mostra os botões de navegação conforme o índice
        prevBtn.style.visibility = indice === 0 ? 'hidden' : 'visible';
        nextBtn.style.visibility = indice === fotosAtuais.length - 1 ? 'hidden' : 'visible';
    };

    const proximaFoto = () => {
        if (indiceFotoAtual < fotosAtuais.length - 1) {
            indiceFotoAtual++;
            mostrarFoto(indiceFotoAtual);
        }
    };

    const fotoAnterior = () => {
        if (indiceFotoAtual > 0) {
            indiceFotoAtual--;
            mostrarFoto(indiceFotoAtual);
        }
    };
    
    // --- FUNÇÕES PRINCIPAIS DE CONSULTA ---
    
    const carregarPets = async () => {
        listaPets.innerHTML = '<p>Carregando pets...</p>';
        const estadoFiltro = filtroEstadoSelect.value;
        const cidadeFiltro = filtroCidadeSelect.value;
        let query = supabaseClient.from('pets_encontrados').select('*').eq('status', 'encontrado').order('created_at', { ascending: false });
        if (estadoFiltro) query = query.eq('estado', estadoFiltro);
        if (cidadeFiltro) query = query.eq('cidade', cidadeFiltro);
        
        const { data: pets, error } = await query;
        petsCarregados = pets || []; // Armazena os resultados na variável de estado

        if (error) {
            console.error('Erro ao buscar pets:', error);
            listaPets.innerHTML = '<p style="color: red;">Erro ao carregar os pets.</p>';
            return;
        }

        if (petsCarregados.length === 0) {
            listaPets.innerHTML = '<p>Nenhum pet encontrado com esses filtros.</p>';
            return;
        }

        listaPets.innerHTML = ''; 
        petsCarregados.forEach(pet => {
            const fotoUrl = (pet.fotos_urls && pet.fotos_urls.length > 0) ? pet.fotos_urls[0] : 'https://via.placeholder.com/300x200?text=Sem+Foto';
            
            // --- LÓGICA PARA ADICIONAR O BOTÃO "VER MAIS FOTOS" ---
            let botaoVerMaisFotos = '';
            if (pet.fotos_urls && pet.fotos_urls.length > 1) {
                botaoVerMaisFotos = `<button class="ver-fotos-btn" data-id="${pet.id}">Ver mais fotos</button>`;
            }

            const petCard = document.createElement('div');
            petCard.className = 'pet-card';
            petCard.innerHTML = `
                <img src="${fotoUrl}" alt="Foto do PET">
                <div class="pet-card-info">
                    <h3>${pet.cidade} - ${pet.estado}</h3>
                    <p><strong>Observações:</strong> ${pet.observacoes || 'Nenhuma'}</p>
                    <div class="card-botoes">
                        <a href="https://wa.me/55${pet.whatsapp_contato}" target="_blank" class="whatsapp-btn">Entrar em contato</a>
                        ${botaoVerMaisFotos}
                        <button class="devolvido-btn" data-id="${pet.id}" data-palavra-chave="${pet.palavra_chave}">Devolvido ao Dono</button>
                    </div>
                </div>
            `;
            listaPets.appendChild(petCard);
        });
    };
    
    const marcarComoDevolvido = async (petId, palavraChaveCorreta) => {
        const palavraChaveDigitada = prompt("Para confirmar a devolução, digite a palavra-chave:");
        if (palavraChaveDigitada === null) return;
        if (palavraChaveDigitada.trim() === palavraChaveCorreta) {
            const { error } = await supabaseClient.from('pets_encontrados').update({ status: 'devolvido' }).eq('id', petId);
            if (error) {
                console.error('Erro ao atualizar status:', error);
                alert('Não foi possível atualizar o status.');
            } else {
                alert('Status atualizado com sucesso!');
                await carregarPets();
            }
        } else {
            alert('Palavra-chave incorreta!');
        }
    };

    // --- EVENT LISTENERS ---
    
    // Listeners dos filtros
    carregarEstados(filtroEstadoSelect);
    filtroEstadoSelect.addEventListener('change', () => {
        carregarCidades(filtroEstadoSelect.value, filtroCidadeSelect);
    });
    btnFiltrar.addEventListener('click', carregarPets);

    // Listener delegado para os botões dentro dos cards
    listaPets.addEventListener('click', (event) => {
        const target = event.target;
        if (target && target.matches('button.devolvido-btn')) {
            const petId = target.getAttribute('data-id');
            const palavraChave = target.getAttribute('data-palavra-chave');
            marcarComoDevolvido(petId, palavraChave);
        }
        if (target && target.matches('button.ver-fotos-btn')) {
            const petId = target.getAttribute('data-id');
            abrirModalFotos(petId);
        }
    });

    // Listeners da modal de fotos
    modalFotosCloseBtn.addEventListener('click', fecharModalFotos);
    modalFotosOverlay.addEventListener('click', (event) => {
        if (event.target === modalFotosOverlay) fecharModalFotos();
    });
    prevBtn.addEventListener('click', fotoAnterior);
    nextBtn.addEventListener('click', proximaFoto);
    // Permite navegar com as setas do teclado
    document.addEventListener('keydown', (event) => {
        if (!modalFotosOverlay.classList.contains('hidden')) {
            if (event.key === 'ArrowRight') proximaFoto();
            if (event.key === 'ArrowLeft') fotoAnterior();
            if (event.key === 'Escape') fecharModalFotos();
        }
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    listaPets.innerHTML = '<p>Selecione o Estado e Cidade para começar a buscar.</p>';
});