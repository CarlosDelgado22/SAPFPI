// Cargos disponibles en el sistema (datos de referencia fijos)
const cargos = [
  { id_cargo: 1, nom_cargo: 'Instructor' },
  { id_cargo: 2, nom_cargo: 'Coordinador' },
  { id_cargo: 3, nom_cargo: 'Lider de Area' }
];

// Programas de formación disponibles
let programas = [
  { id_programa_titul: 101, nom_programa_titul: 'Tecnico en Software', tip_programa_titul: 'Tn' },
  { id_programa_titul: 102, nom_programa_titul: 'Tecnologo en Redes',  tip_programa_titul: 'To' }
];

// Ambientes físicos del sistema
let ambientes = [
  { id_ambiente: 1, nom_ambiente: 'Lab TI 101' },
  { id_ambiente: 2, nom_ambiente: 'Aula Empresarial' }
];

// Variables globales mutables (se cargan desde localStorage o se inicializan con semilla)
let instructores = [];
let competencias = [];
let instructorCompetencias = [];
let fichasTituladas = [];

// Clave secreta para el cifrado (en producción va en el servidor, nunca aquí)
const CLAVE_SECRETA = 'MiClave$1234';

// CIFRADO: Convierte datos a texto cifrado en Base64
function cifrarDatos(data, clave) {
  const texto = JSON.stringify(data);
  let encriptado = '';
  for (let i = 0; i < texto.length; i++) {
    encriptado += String.fromCharCode(texto.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
  }
  return btoa(encriptado);
}

// DESCIFRADO: Proceso inverso para recuperar los datos originales
function descifrarDatos(dataEncriptado, clave) {
  try {
    const cifrado = atob(dataEncriptado);
    let descifrado = '';
    for (let i = 0; i < cifrado.length; i++) {
      descifrado += String.fromCharCode(cifrado.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return JSON.parse(descifrado);
  } catch {
    return null;
  }
}

// ======= PASO 12: Persistencia cifrada en localStorage =======

// Guarda TODOS los datos de la app cifrados
function guardarDatos() {
  const data = { 
    instructores, 
    competencias, 
    instructorCompetencias, 
    fichasTituladas, 
    programas, 
    ambientes 
  };
  const cifrado = cifrarDatos(data, CLAVE_SECRETA);
  localStorage.setItem('sapfpiDB', cifrado);
}

// Carga los datos al iniciar la app
function cargarDatosIniciales() {
  const stored = localStorage.getItem('sapfpiDB');
  if (stored) {
    const parsed = descifrarDatos(stored, CLAVE_SECRETA);
    if (parsed) {
      instructores           = parsed.instructores           || [];
      competencias           = parsed.competencias           || [];
      instructorCompetencias = parsed.instructorCompetencias || [];
      fichasTituladas        = parsed.fichasTituladas        || [];
      programas              = parsed.programas              || programas;
      ambientes              = parsed.ambientes              || ambientes;
      return;
    }
    localStorage.removeItem('sapfpiDB');
  }

  // Datos semilla de ejemplo
  instructores = [
    { 
      id_instruc: 1001, nom_instruc: 'Ana', apelli_instruc: 'Garcia',
      tele_instruc: '3001234567', correo_instruc: 'ana@correo.com',
      id_cargo: 1, ind_planta: true, ind_lider_ficha: true
    },
    { 
      id_instruc: 1002, nom_instruc: 'Carlos', apelli_instruc: 'Mendoza',
      tele_instruc: '3109876543', correo_instruc: 'carlos@correo.com',
      id_cargo: 2, ind_planta: false, ind_lider_ficha: false
    }
  ];
}

// ======= FUNCIONES DE RENDERIZADO Y UTILIDADES =======

function getCargoNombre(id_cargo) {
  const c = cargos.find(c => c.id_cargo === parseInt(id_cargo));
  return c ? c.nom_cargo : 'Instructor';
}

function renderInstructores() {
  const tbody = document.getElementById('instructoresTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  instructores.forEach(inst => {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = inst.id_instruc;
    row.insertCell(1).innerText = `${inst.nom_instruc} ${inst.apelli_instruc}`;
    row.insertCell(2).innerText = inst.tele_instruc || '';
    row.insertCell(3).innerText = inst.correo_instruc || '';
    row.insertCell(4).innerText = getCargoNombre(inst.id_cargo);
    
    row.insertCell(5).innerHTML = inst.ind_planta
      ? '<span class="badge">Planta</span>'
      : '<span class="badge">Contrato</span>';
      
    row.insertCell(6).innerHTML = inst.ind_lider_ficha
      ? '<i class="fas fa-check-circle" style="color:green"></i>'
      : '<i class="fas fa-times-circle" style="color:gray"></i>';

    const accel = row.insertCell(7);
    accel.innerHTML = `
      <button class="icon-btn edit" data-id="${inst.id_instruc}"><i class="fas fa-edit"></i></button>
      <button class="icon-btn delete" data-id="${inst.id_instruc}"><i class="fas fa-trash-alt"></i></button>
    `;
  });

  // Eventos botones
  document.querySelectorAll('#instructoresTbody .icon-btn.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const inst = instructores.find(i => i.id_instruc === id);
      if (inst) abrirModalInstructor(inst);
    });
  });

  document.querySelectorAll('#instructoresTbody .icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      if (confirm(`¿Desea eliminar el instructor con ID ${id}?`)) {
        instructores = instructores.filter(i => i.id_instruc !== id);
        instructorCompetencias = instructorCompetencias.filter(a => a.id_instruc !== id);
        guardarDatos();
        renderAll();
        actualizarSelectsAsignacion();
      }
    });
  });
}

function renderCompetencias() {
  const tbody = document.getElementById('competenciasTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Muestra cada competencia y sus acciones para editarla o eliminarla.
  competencias.forEach(comp => {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = comp.id_competen;
    row.insertCell(1).innerText = comp.nom_competen;
    row.insertCell(2).innerText = comp.tip_competen || '';
    row.insertCell(3).innerText = comp.dur_competen ?? '';

    const actions = row.insertCell(4);
    actions.innerHTML = `
      <button class="icon-btn edit" data-id="${comp.id_competen}" aria-label="Editar competencia"><i class="fas fa-edit"></i></button>
      <button class="icon-btn delete" data-id="${comp.id_competen}" aria-label="Eliminar competencia"><i class="fas fa-trash-alt"></i></button>
    `;
  });

  tbody.querySelectorAll('.icon-btn.edit').forEach(btn => {
    btn.addEventListener('click', event => {
      const id = Number(event.currentTarget.dataset.id);
      const comp = competencias.find(item => item.id_competen === id);
      if (comp) abrirModalCompetencia(comp);
    });
  });

  tbody.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', event => {
      const id = Number(event.currentTarget.dataset.id);
      // Se evita borrar competencias que todavía tengan instructores asignados.
      if (instructorCompetencias.some(asig => asig.id_competen === id)) {
        alert('No se puede eliminar la competencia porque tiene instructores asignados. Elimine primero esas asignaciones.');
        return;
      }

      if (confirm(`¿Desea eliminar la competencia con ID ${id}?`)) {
        competencias = competencias.filter(item => item.id_competen !== id);
        guardarDatos();
        renderAll();
        actualizarSelectsAsignacion();
      }
    });
  });
}

function renderAsignaciones() {
  const tbody = document.getElementById('asignacionesTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Relaciona los identificadores guardados con los nombres visibles en la tabla.
  instructorCompetencias.forEach((asig, index) => {
    const inst = instructores.find(i => i.id_instruc === asig.id_instruc);
    const comp = competencias.find(c => c.id_competen === asig.id_competen);

    const row = tbody.insertRow();
    row.insertCell(0).innerText = inst ? `${inst.nom_instruc} ${inst.apelli_instruc}` : asig.id_instruc;
    row.insertCell(1).innerText = comp ? comp.nom_competen : asig.id_competen;
    row.insertCell(2).innerHTML = `<button class="icon-btn delete" data-index="${index}" aria-label="Eliminar asignación"><i class="fas fa-trash-alt"></i></button>`;
  });

  tbody.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      instructorCompetencias.splice(idx, 1);
      guardarDatos();
      renderAsignaciones();
    });
  });
}

function renderAll() {
  renderInstructores();
  renderCompetencias();
  renderAsignaciones();
}

// ======= MODALES Y FORMULARIOS =======

function abrirModalInstructor(instructor = null) {
  const isEdit = instructor !== null;

  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal-overlay';

  modalDiv.innerHTML = `
    <div class="modal-card">
      <h3>${isEdit ? 'Editar Instructor' : 'Nuevo Instructor'}</h3>
      <div class="form-group">
        <label>ID Instructor</label>
        <input id="modalIdInst" type="number" value="${isEdit ? instructor.id_instruc : ''}" ${isEdit ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label>Nombres</label>
        <input id="modalNom" type="text" value="${isEdit ? instructor.nom_instruc : ''}">
      </div>
      <div class="form-group">
        <label>Apellidos</label>
        <input id="modalApe" type="text" value="${isEdit ? instructor.apelli_instruc : ''}">
      </div>
      <div class="form-group">
        <label>Teléfono</label>
        <input id="modalTel" type="number" value="${isEdit ? instructor.tele_instruc : ''}">
      </div>
      <div class="form-group">
        <label>Correo</label>
        <input id="modalCorreo" type="email" value="${isEdit ? instructor.correo_instruc : ''}">
      </div>
      <div class="form-group">
        <label>Cargo</label>
        <select id="modalCargo">
          ${cargos.map(c => `<option value="${c.id_cargo}" ${isEdit && instructor.id_cargo === c.id_cargo ? 'selected' : ''}>${c.nom_cargo}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label><input id="modalPlanta" type="checkbox" ${isEdit && instructor.ind_planta ? 'checked' : ''}> Es de Planta</label>
      </div>
      <div class="form-group">
        <label><input id="modalLider" type="checkbox" ${isEdit && instructor.ind_lider_ficha ? 'checked' : ''}> Líder de Ficha</label>
      </div>
      <div class="flex-buttons">
        <button id="modalCancel" type="button">Cancelar</button>
        <button id="modalSave" type="button">Guardar</button>
      </div>
    </div>`;

  document.body.appendChild(modalDiv);

  modalDiv.querySelector('#modalCancel').onclick = () => modalDiv.remove();

  modalDiv.querySelector('#modalSave').onclick = () => {
    // Aquí capturamos todas las variables correctamente para que no de error
    const id = parseInt(modalDiv.querySelector('#modalIdInst').value);
    const nom = modalDiv.querySelector('#modalNom').value.trim();
    const ape = modalDiv.querySelector('#modalApe').value.trim();
    const tel = modalDiv.querySelector('#modalTel').value.trim();
    const correo = modalDiv.querySelector('#modalCorreo').value.trim();
    const idcar = parseInt(modalDiv.querySelector('#modalCargo').value);
    const planta = modalDiv.querySelector('#modalPlanta').checked;
    const lider = modalDiv.querySelector('#modalLider').checked;

    if (!id || !nom || !ape) {
      alert('Complete los campos obligatorios (ID, Nombres, Apellidos)');
      return;
    }

    if (!isEdit && instructores.some(i => i.id_instruc === id)) {
      alert('El ID de instructor ya existe');
      return;
    }

    const nuevoInstructor = {
      id_instruc: id,
      nom_instruc: nom,
      apelli_instruc: ape,
      tele_instruc: tel,
      correo_instruc: correo,
      id_cargo: idcar,
      ind_planta: planta,
      ind_lider_ficha: lider
    };

    if (isEdit) {
      const index = instructores.findIndex(i => i.id_instruc === id);
      instructores[index] = nuevoInstructor;
    } else {
      instructores.push(nuevoInstructor);
    }

    guardarDatos();
    renderAll();
    actualizarSelectsAsignacion();
    modalDiv.remove();
  };
}

function abrirModalCompetencia(competencia = null) {
  // Si se recibe una competencia, el formulario se abre en modo edición.
  const isEdit = competencia !== null;
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal-overlay';
  modalDiv.innerHTML = `
    <div class="modal-card">
      <h3>${isEdit ? 'Editar Competencia' : 'Nueva Competencia'}</h3>
      <div class="form-group">
        <label for="modalIdComp">ID Competencia</label>
        <input id="modalIdComp" type="number" min="1" ${isEdit ? 'readonly' : ''}>
      </div>
      <div class="form-group">
        <label for="modalNomComp">Nombre Competencia</label>
        <input id="modalNomComp" type="text">
      </div>
      <div class="form-group">
        <label for="modalTipoComp">Tipo</label>
        <input id="modalTipoComp" type="text">
      </div>
      <div class="form-group">
        <label for="modalDurComp">Duración (Horas)</label>
        <input id="modalDurComp" type="number" min="1">
      </div>
      <div class="flex-buttons">
        <button id="modalCancelComp" type="button">Cancelar</button>
        <button id="modalSaveComp" type="button">Guardar</button>
      </div>
    </div>`;

  document.body.appendChild(modalDiv);

  modalDiv.querySelector('#modalIdComp').value = isEdit ? competencia.id_competen : '';
  modalDiv.querySelector('#modalNomComp').value = isEdit ? competencia.nom_competen : '';
  modalDiv.querySelector('#modalTipoComp').value = isEdit ? competencia.tip_competen || '' : '';
  modalDiv.querySelector('#modalDurComp').value = isEdit ? competencia.dur_competen ?? '' : '';
  modalDiv.querySelector('#modalCancelComp').onclick = () => modalDiv.remove();

  modalDiv.querySelector('#modalSaveComp').onclick = () => {
    const id = Number(modalDiv.querySelector('#modalIdComp').value);
    const nombre = modalDiv.querySelector('#modalNomComp').value.trim();
    const tipo = modalDiv.querySelector('#modalTipoComp').value.trim();
    const duracion = Number(modalDiv.querySelector('#modalDurComp').value);

    // Valida los datos antes de crear o actualizar el registro.
    if (!Number.isInteger(id) || id <= 0 || !nombre || !tipo ||
        !Number.isInteger(duracion) || duracion <= 0) {
      alert('Ingrese un ID válido, nombre, tipo y una duración en horas mayor que cero.');
      return;
    }

    if (!isEdit && competencias.some(item => item.id_competen === id)) {
      alert('El ID de competencia ya existe.');
      return;
    }

    const nuevaCompetencia = {
      id_competen: id,
      nom_competen: nombre,
      tip_competen: tipo,
      dur_competen: duracion
    };

    if (isEdit) {
      const index = competencias.findIndex(item => item.id_competen === id);
      if (index === -1) {
        alert('No se encontró la competencia que desea editar.');
        modalDiv.remove();
        return;
      }
      competencias[index] = nuevaCompetencia;
    } else {
      competencias.push(nuevaCompetencia);
    }

    guardarDatos();
    renderAll();
    actualizarSelectsAsignacion();
    modalDiv.remove();
  };
}

function abrirModalFicha() {
  console.log('Falta implementar el modal de fichas');
}

// ======= ASIGNACIONES =======

function actualizarSelectsAsignacion() {
  const selectInst = document.getElementById('asignInstrucSelect');
  const selectComp = document.getElementById('asignCompetSelect');
  
  if (selectInst) {
    // Actualiza las opciones y conserva la selección si el instructor sigue existiendo.
    const selectedId = selectInst.value;
    selectInst.replaceChildren(new Option('Seleccione un instructor...', ''));
    instructores.forEach(instructor => {
      selectInst.add(new Option(
        `${instructor.id_instruc} - ${instructor.nom_instruc} ${instructor.apelli_instruc}`,
        instructor.id_instruc
      ));
    });
    if (instructores.some(instructor => String(instructor.id_instruc) === selectedId)) {
      selectInst.value = selectedId;
    }
  }
  if (selectComp) {
    // Actualiza las competencias disponibles y conserva la selección válida.
    const selectedId = selectComp.value;
    selectComp.replaceChildren(new Option('Seleccione una competencia...', ''));
    competencias.forEach(competencia => {
      selectComp.add(new Option(
        `${competencia.id_competen} - ${competencia.nom_competen}`,
        competencia.id_competen
      ));
    });
    if (competencias.some(competencia => String(competencia.id_competen) === selectedId)) {
      selectComp.value = selectedId;
    }
  }
}

document.getElementById('btnAsignar')?.addEventListener('click', () => {
  const idInst = Number(document.getElementById('asignInstrucSelect')?.value);
  const idComp = Number(document.getElementById('asignCompetSelect')?.value);
  
  // Verifica que ambos elementos seleccionados existan antes de guardar la relación.
  if (!Number.isInteger(idInst) || !instructores.some(i => i.id_instruc === idInst) ||
      !Number.isInteger(idComp) || !competencias.some(c => c.id_competen === idComp)) {
    return alert('Seleccione un instructor y una competencia válidos.');
  }

  if (instructorCompetencias.some(a => a.id_instruc === idInst && a.id_competen === idComp)) {
    return alert('Ese instructor ya está asignado a esa competencia.');
  }

  // Guarda la relación instructor-competencia y refresca la tabla.
  instructorCompetencias.push({ id_instruc: idInst, id_competen: idComp });
  guardarDatos();
  renderAsignaciones();
  document.getElementById('asignInstrucSelect').value = '';
  document.getElementById('asignCompetSelect').value = '';
});


// ======= PASO 16: Sistema de Tabs y inicialización =======

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const activeContent = document.getElementById(tabId);
      if (activeContent) activeContent.classList.add('active');

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }); // <--- Este es el cierre que faltaba en tu código

  const btnAddInst = document.getElementById('btnAddInstructor');
  if (btnAddInst) btnAddInst.onclick = () => abrirModalInstructor(null);

  const btnAddComp = document.getElementById('btnAddCompetencia');
  if (btnAddComp) btnAddComp.onclick = () => abrirModalCompetencia(null);

  const btnAddFicha = document.getElementById('btnAddFicha');
  if (btnAddFicha) btnAddFicha.onclick = () => abrirModalFicha(null);
}

// ======= SECUENCIA DE INICIALIZACIÓN =======
document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  renderAll();
  initTabs();
  actualizarSelectsAsignacion();
});