// ============================================================================
// ARQUIVO DE LÓGICA DA PÁGINA DE CADASTRO (cadastrar.js)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    if (!formCadastro) return;
    
    // --- SELEÇÃO DE ELEMENTOS ---
    const fotosInput = document.getElementById('fotos');
    const whatsappInput = document.getElementById('whatsapp');
    const formEstadoSelect = document.getElementById('form-estado');
    const formCidadeSelect = document.getElementById('form-cidade');
    const palavraChaveInput = document.getElementById('palavra-chave');
    const btnSubmit = document.getElementById('btn-submit');
    const loader = document.querySelector('#btn-submit .loader');
    const fileNamesDisplay = document.getElementById('file-names');

    // --- LÓGICA ATUALIZADA PARA MOSTRAR E ABREVIAR NOMES DOS ARQUIVOS ---
    fotosInput.addEventListener('change', () => {
        const MAX_LENGTH = 50; // Define o comprimento máximo da string de nomes

        if (fotosInput.files.length > 0) {
            // Cria uma string com os nomes dos arquivos, separados por vírgula
            let fileNamesString = Array.from(fotosInput.files)
                                     .map(file => file.name)
                                     .join(', ');

            // Verifica se a string é muito longa e a abrevia se necessário
            if (fileNamesString.length > MAX_LENGTH) {
                fileNamesString = fileNamesString.substring(0, MAX_LENGTH) + '...';
            }
            
            fileNamesDisplay.textContent = fileNamesString;
        } else {
            fileNamesDisplay.textContent = 'Nenhum arquivo selecionado';
        }
    });
    // --- FIM DA LÓGICA ATUALIZADA ---

    carregarEstados(formEstadoSelect);
    
    formEstadoSelect.addEventListener('change', () => {
        carregarCidades(formEstadoSelect.value, formCidadeSelect);
    });

    whatsappInput.addEventListener('input', (event) => {
        let valor = event.target.value.replace(/\D/g, '');
        if (valor.length > 11) { valor = valor.slice(0, 11); }
        if (valor.length > 10) { valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); } 
        else if (valor.length > 6) { valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); } 
        else if (valor.length > 2) { valor = valor.replace(/^(\d{2})(\d*)/, '($1) $2'); } 
        else { valor = valor.replace(/^(\d*)/, '($1'); }
        event.target.value = valor;
    });

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
            for (const foto of fotosInput.files) {
                const nomeArquivo = `${Date.now()}-${foto.name}`;
                const { error: uploadError } = await supabaseClient.storage.from('fotos_pets').upload(nomeArquivo, foto);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabaseClient.storage.from('fotos_pets').getPublicUrl(nomeArquivo);
                fotosUrls.push(publicUrl);
            }
            
            const petData = {
                whatsapp_contato: whatsappLimpo,
                cidade: formCidadeSelect.value,
                estado: formEstadoSelect.value,
                observacoes: document.getElementById('observacoes').value,
                fotos_urls: fotosUrls,
                palavra_chave: palavraChaveInput.value,
                status: 'encontrado'
            };

            const { error: insertError } = await supabaseClient.from('pets_encontrados').insert([petData]);
            if (insertError) throw insertError;

            alert(`CADASTRO REALIZADO!\n\nGuarde bem sua Palavra-chave: "${palavraChaveInput.value}" ...`);
            formCadastro.reset();
            fileNamesDisplay.textContent = 'Nenhum arquivo selecionado'; // Limpa o display de nomes
            formCidadeSelect.innerHTML = '<option value="">Aguardando estado...</option>';
            formCidadeSelect.disabled = true;

        } catch (error) {
            console.error('Erro detalhado no processo de cadastro:', error);
            alert(`Ocorreu um erro ao cadastrar: ${error.message}.`);
        } finally {
            btnSubmit.disabled = false;
            loader.classList.add('hidden');
        }
    });
});