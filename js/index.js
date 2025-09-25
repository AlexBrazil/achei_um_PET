// ============================================================================
// ARQUIVO DE LÓGICA DA PÁGINA INICIAL (index.js)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const formFornecedores = document.getElementById('form-fornecedores');
    
    // Se o formulário não existir nesta página, não faz nada.
    if (!formFornecedores) return;

    const inputDDD = document.getElementById('input-ddd');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const abrirModal = () => modalOverlay.classList.remove('hidden');
    const fecharModal = () => modalOverlay.classList.add('hidden');

    modalCloseBtn.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) fecharModal();
    });

    formFornecedores.addEventListener('submit', async (event) => {
        event.preventDefault();
        const ddd = inputDDD.value.trim();

        if (!/^\d{2}$/.test(ddd)) {
            alert('Por favor, digite um DDD válido com 2 dígitos.');
            return;
        }

        modalBody.innerHTML = '<p>Buscando...</p>';
        abrirModal();

        try {
            const { data: fornecedores, error } = await supabaseClient
                .from('Fornecedores')
                .select('nome_fornecedor, whatsapp_fornecedor, bairro')
                .eq('codigo_area', ddd)
                .eq('ativo', true);

            if (error) throw error;

            if (fornecedores.length === 0) {
                modalBody.innerHTML = '<p>Nenhuma empresa encontrada para este DDD.</p>';
            } else {
                let htmlLista = '<ul>';
                fornecedores.forEach(fornecedor => {
                    // Apenas renderiza o fornecedor se o nome existir
                    if (fornecedor.nome_fornecedor) {
                        
                        // Verifica se o WhatsApp existe antes de tentar processá-lo
                        const temWhatsapp = fornecedor.whatsapp_fornecedor && typeof fornecedor.whatsapp_fornecedor === 'string';
                        const numeroLimpo = temWhatsapp ? fornecedor.whatsapp_fornecedor.split('@')[0] : '';
                        const linkWhatsapp = temWhatsapp ? `<a href="https://wa.me/${numeroLimpo}" target="_blank" class="fornecedor-whatsapp">Chamar no WhatsApp</a>` : '<p class="sem-whatsapp">WhatsApp não informado</p>';

                        htmlLista += `
                            <li>
                                <div class="fornecedor-nome">${fornecedor.nome_fornecedor}</div>
                                <div class="fornecedor-bairro">Bairro: ${fornecedor.bairro || 'Não informado'}</div>
                                ${linkWhatsapp}
                            </li>
                        `;
                    }
                });
                htmlLista += '</ul>';
                modalBody.innerHTML = htmlLista;
            }
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error);
            modalBody.innerHTML = '<p style="color: red;">Ocorreu um erro ao buscar. Tente novamente.</p>';
        }
    });
});