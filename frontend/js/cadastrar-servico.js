const URL_API = "http://localhost:3000/api";
let tokenGlobal = null;

const form = document.getElementById("formServico");

// LOGIN AUTOMÁTICO
async function fazerLogin() {
    try {
        const response = await fetch(`${URL_API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@salao.com",
                password: "Admin@123"
            })
        });

        const data = await response.json();

        if (data.success) {
            tokenGlobal = data.data.token;
            console.log("✅ Login realizado!");
        } else {
            alert("Erro ao autenticar");
        }
    } catch (error) {
        console.error("Erro no login:", error);
    }
}

// Normalização do nome
function normalizarNome(nome) {
    return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

/* ─── VALIDAÇÃO ─────────────────────────────────────────────────────────── */
const FIELD_RULES = [
    {
        inputId:  'nome',
        errorId:  'error-nome',
        prepare:  v => v.trim(),
        rules: [
            { test: v => v.length > 0, msg: 'O nome do serviço é obrigatório.' },
        ],
    },
    {
        inputId:  'duracao',
        errorId:  'error-duracao',
        prepare:  v => v.trim(),
        rules: [
            { test: v => v.length > 0, msg: 'A duração é obrigatória.' },
            { test: v => Number.isInteger(Number(v)), msg: 'A duração deve ser um número inteiro.' },
            { test: v => Number(v) > 0, msg: 'A duração deve ser maior que zero.' },
        ],
    },
    {
        inputId:  'valor',
        errorId:  'error-valor',
        prepare:  v => v.replace(',', '.').trim(),
        rules: [
            { test: v => v.length > 0, msg: 'O valor do serviço é obrigatório.' },
            { test: v => !isNaN(Number(v)), msg: 'O valor deve ser numérico.' },
            { test: v => Number(v) > 0, msg: 'O valor deve ser maior que zero.' },
        ],
    },
];

function _setFieldError(inputId, errorId, msg) {
    document.getElementById(inputId).classList.add('error');
    const el = document.getElementById(errorId);
    el.textContent = msg;
    el.classList.add('visible');
}

function _clearFieldError(inputId, errorId) {
    document.getElementById(inputId).classList.remove('error');
    const el = document.getElementById(errorId);
    el.textContent = '';
    el.classList.remove('visible');
}

function _validarCampo({ inputId, errorId, prepare, rules }) {
    const raw   = document.getElementById(inputId).value;
    const value = prepare(raw);

    for (const { test, msg } of rules) {
        if (!test(value)) {
            _setFieldError(inputId, errorId, msg);
            return false;
        }
    }
    _clearFieldError(inputId, errorId);
    return true;
}

function _validarDados() {
    const results = FIELD_RULES.map(_validarCampo);
    return results.every(Boolean);
}

function _bindRealtimeValidation() {
    FIELD_RULES.forEach(fieldDef => {
        const input = document.getElementById(fieldDef.inputId);
        input.addEventListener('blur', () => _validarCampo(fieldDef));
        input.addEventListener('input', () => _clearFieldError(fieldDef.inputId, fieldDef.errorId));
    });
}

// 2. SUBMIT DO FORM
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Executa a validação antes de qualquer coisa
    if (!_validarDados()) {
        return; 
    }

    let nomeInput = document.getElementById("nome").value;
    let nome = normalizarNome(nomeInput);

    let duracao = document.getElementById("duracao").value;
    
    let valor = document.getElementById("valor").value;
    valor = valor.replace(",", ".");

    // garante autenticação
    if (!tokenGlobal) {
        alert("Usuário não autenticado");
        return;
    }

    //  CHAMADA AO BACKEND
    try {
        const response = await fetch(`${URL_API}/admin/services`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenGlobal}`
            },
            body: JSON.stringify({
                name: nomeInput.trim(),
                duration_minutes: Number(duracao),
                price: Number(valor),
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message && data.message.toLowerCase().includes("nome")) {
                _setFieldError('nome', 'error-nome', "Já existe um serviço com este nome.");
            } else {
                alert(data.message || "Erro ao cadastrar serviço");
            }
            return;
        }

        alert("✅ Serviço cadastrado com sucesso!");
        form.reset();

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    fazerLogin();
    _bindRealtimeValidation(); 
});