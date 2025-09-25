// ============================================================================
// ARQUIVO DE LÓGICA DA PÁGINA DE CADASTRO (cadastrar.js)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');

    // Se o formulário não existir nesta página, não faz nada.
    if (!formCadastro) return;
    
    const fotosInput = document.getElementById('fotos');
    const whatsappInput = document.getElementById('whatsapp');
    const formEstadoSelect = document.getElementById('form-estado');
    const formCidadeSelect = document.getElementById('form-cidade');
    const palavraChaveInput = document.getElementById('palavra-chave');
    const btnSubmit = document.getElementById('btn-submit');
    const loader = document.querySelector('#btn-submit .loader');

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
        // ... (resto da validação e lógica de cadastro) ...
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