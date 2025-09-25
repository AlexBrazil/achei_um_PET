// ============================================================================
// ARQUIVO DE LÓGICA DA PÁGINA DE CONSULTA (consultar.js)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const listaPets = document.getElementById('lista-pets');

    // Se a lista não existir nesta página, não faz nada.
    if (!listaPets) return;

    const filtroEstadoSelect = document.getElementById('filtro-estado');
    const filtroCidadeSelect = document.getElementById('filtro-cidade');
    const btnFiltrar = document.getElementById('btn-filtrar');
    
    carregarEstados(filtroEstadoSelect);
    
    filtroEstadoSelect.addEventListener('change', () => {
        carregarCidades(filtroEstadoSelect.value, filtroCidadeSelect);
    });
    
    const carregarPets = async () => {
        listaPets.innerHTML = '<p>Carregando pets...</p>';
        const estadoFiltro = filtroEstadoSelect.value;
        const cidadeFiltro = filtroCidadeSelect.value;
        let query = supabaseClient.from('pets_encontrados').select('*').eq('status', 'encontrado').order('created_at', { ascending: false });
        if (estadoFiltro) query = query.eq('estado', estadoFiltro);
        if (cidadeFiltro) query = query.eq('cidade', cidadeFiltro);
        const { data: pets, error } = await query;

        if (error) {
            console.error('Erro ao buscar pets:', error);
            listaPets.innerHTML = '<p style="color: red;">Erro ao carregar os pets.</p>';
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
                    <a href="https://wa.me/55${pet.whatsapp_contato}" target="_blank" class="whatsapp-btn">Entrar em contato</a>
                    <button class="devolvido-btn" data-id="${pet.id}" data-palavra-chave="${pet.palavra_chave}">Devolvido ao Dono</button>
                </div>
            `;
            listaPets.appendChild(petCard);
        });
    };
    
    const marcarComoDevolvido = async (petId, palavraChaveCorreta) => {
        const palavraChaveDigitada = prompt("Para confirmar a devolução, digite a palavra-chave:");
        if (palavraChaveDigitada === null) return;
        if (palavraChaveDigitada.trim() === palavraChaveCorreta) {
            await supabaseClient.from('pets_encontrados').update({ status: 'devolvido' }).eq('id', petId);
            alert('Status atualizado!');
            await carregarPets();
        } else {
            alert('Palavra-chave incorreta!');
        }
    };

    btnFiltrar.addEventListener('click', carregarPets);

    listaPets.addEventListener('click', (event) => {
        if (event.target && event.target.matches('button.devolvido-btn')) {
            const petId = event.target.getAttribute('data-id');
            const palavraChave = event.target.getAttribute('data-palavra-chave');
            marcarComoDevolvido(petId, palavraChave);
        }
    });

    listaPets.innerHTML = '<p>Selecione o Estado e Cidade para começar a buscar.</p>';
});