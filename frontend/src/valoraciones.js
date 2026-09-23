// MÓDULO DE VALORACIONES Y RESEÑAS DE MAZOS

let calificacionSeleccionada = 0;

function configurarSelectorEstrellas() {
  const contenedor = document.getElementById('rating-estrellas-selector');
  const textoFeedback = document.getElementById('rating-texto-seleccion');
  if (!contenedor) return;

  const botones = contenedor.querySelectorAll('.estrella-btn');
  const textos = {
    1: '1 estrella - Malo / Desbalanceado',
    2: '2 estrellas - Regular / Mejorable',
    3: '3 estrellas - Bueno / Entretenido',
    4: '4 estrellas - Muy Bueno / Competitivo',
    5: '5 estrellas - Excelente / ¡Obra Maestra!'
  };

  const actualizarVisualEstrellas = (valor) => {
    botones.forEach(btn => {
      const btnVal = Number(btn.dataset.valor);
      if (btnVal <= valor) btn.classList.add('activa');
      else btn.classList.remove('activa');
    });
  };

  botones.forEach(btn => {
    btn.onmouseenter = () => {
      const val = Number(btn.dataset.valor);
      botones.forEach(b => {
        if (Number(b.dataset.valor) <= val) b.classList.add('hover');
        else b.classList.remove('hover');
      });
      if (textoFeedback) textoFeedback.textContent = textos[val] || '';
    };
    btn.onmouseleave = () => {
      botones.forEach(b => b.classList.remove('hover'));
      actualizarVisualEstrellas(calificacionSeleccionada);
      if (textoFeedback) {
        textoFeedback.textContent = calificacionSeleccionada > 0 ? textos[calificacionSeleccionada] : 'Selecciona una calificación';
      }
    };
    btn.onclick = (e) => {
      e.preventDefault();
      calificacionSeleccionada = Number(btn.dataset.valor);
      actualizarVisualEstrellas(calificacionSeleccionada);
      if (textoFeedback) textoFeedback.textContent = textos[calificacionSeleccionada];
    };
  });
  actualizarVisualEstrellas(calificacionSeleccionada);
}

async function cargarValoracionesMazo(idMazo) {
  const elRatingPromedio = document.getElementById('modal-mazo-rating-promedio');
  const elRatingTotal = document.getElementById('modal-mazo-rating-total');
  const contenedorForm = document.getElementById('contenedor-form-valoracion');
  const bannerInvitado = document.getElementById('banner-valoracion-invitado');
  const listaComentarios = document.getElementById('lista-comentarios-mazo');
  const formValoracion = document.getElementById('form-valoracion-mazo');
  const txtComentario = document.getElementById('valoracion-comentario');
  const alertaValoracion = document.getElementById('alerta-valoracion-mazo');
  const linkLogin = document.getElementById('link-login-desde-valoracion');

  if (linkLogin) {
    linkLogin.onclick = (e) => {
      e.preventDefault();
      const modalDetalle = document.getElementById('modal-detalle-mazo');
      if (modalDetalle) modalDetalle.classList.remove('active');
      const btnLogin = document.getElementById('btn-abrir-login');
      if (btnLogin) btnLogin.click();
    };
  }

  const idUsuario = localStorage.getItem('id_usuario');
  if (idUsuario) {
    if (contenedorForm) contenedorForm.style.display = 'block';
    if (bannerInvitado) bannerInvitado.style.display = 'none';
  } else {
    if (contenedorForm) contenedorForm.style.display = 'none';
    if (bannerInvitado) bannerInvitado.style.display = 'block';
  }

  calificacionSeleccionada = 0;
  configurarSelectorEstrellas();
  if (txtComentario) txtComentario.value = '';
  if (alertaValoracion) alertaValoracion.style.display = 'none';
  if (listaComentarios) listaComentarios.innerHTML = '<p class="sin-comentarios-mensaje">Cargando opiniones de la comunidad...</p>';
  try {
    const res = await obtenerValoracionesMazoAPI(idMazo);
    if (res && res.exito) {
      if (res.promedio !== null && res.promedio !== undefined) {
        if (elRatingPromedio) elRatingPromedio.textContent = Number(res.promedio).toFixed(1);
        if (elRatingTotal) elRatingTotal.textContent = '(' + res.total + (res.total === 1 ? ' opinión)' : ' opiniones)');
      } else {
        if (elRatingPromedio) elRatingPromedio.textContent = 'Nuevo';
        if (elRatingTotal) elRatingTotal.textContent = '(Sin opiniones)';
      }

      if (listaComentarios) {
        if (!Array.isArray(res.datos) || res.datos.length === 0) {
          listaComentarios.innerHTML = '<p class="sin-comentarios-mensaje">Aún no hay reseñas para este mazo. ¡Sé el primero en opinar!</p>';
        } else {
          listaComentarios.innerHTML = res.datos.map(val => {
            const estrellasStr = '★'.repeat(val.puntuacion) + '☆'.repeat(Math.max(0, 5 - val.puntuacion));
            const fechaStr = val.fecha_valoracion ? new Date(val.fecha_valoracion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
            const nombreUser = typeof sanitizarHTML === 'function' ? sanitizarHTML(val.nombre_usuario || 'Jugador') : (val.nombre_usuario || 'Jugador');
            const inicial = nombreUser.charAt(0).toUpperCase();
            const comentarioTexto = val.comentario ? '<p class="comentario-texto">' + (typeof sanitizarHTML === 'function' ? sanitizarHTML(val.comentario) : val.comentario) + '</p>' : '';
            const esMio = idUsuario && Number(val.id_usuario) === Number(idUsuario);
            const esAdmin = localStorage.getItem('rol') === 'administrador';
            const btnEliminarHTML = (esMio || esAdmin) ? '<button class="btn-eliminar-valoracion" onclick="eliminarValoracionMazoHandler(' + val.id_valoracion + ', ' + idMazo + ')" title="Eliminar reseña">🗑️</button>' : '';
            return '<div class="comentario-card"><div class="comentario-header"><div class="comentario-autor-box"><div class="comentario-avatar">' + inicial + '</div><span class="comentario-autor-nombre">' + nombreUser + (esMio ? ' <small style="color: #e67e22;">(Tú)</small>' : '') + '</span></div><div class="comentario-meta-right"><span class="comentario-estrellas" title="' + val.puntuacion + ' de 5 estrellas">' + estrellasStr + '</span><span class="comentario-fecha">' + fechaStr + '</span>' + btnEliminarHTML + '</div></div>' + comentarioTexto + '</div>';
          }).join('');
        }
      }

      if (idUsuario && Array.isArray(res.datos)) {
        const miResena = res.datos.find(v => Number(v.id_usuario) === Number(idUsuario));
        if (miResena) {
          calificacionSeleccionada = miResena.puntuacion;
          configurarSelectorEstrellas();
          if (txtComentario && miResena.comentario) txtComentario.value = miResena.comentario;
          const btnSubmit = document.getElementById('btn-submit-valoracion');
          if (btnSubmit) btnSubmit.textContent = '⭐ Actualizar Mi Opinión';
        } else {
          const btnSubmit = document.getElementById('btn-submit-valoracion');
          if (btnSubmit) btnSubmit.textContent = '⭐ Publicar Opinión';
        }
      }
    }
  } catch (error) {
    console.error('Error al cargar valoraciones:', error);
    if (listaComentarios) listaComentarios.innerHTML = '<p class="sin-comentarios-mensaje">No se pudieron cargar las opiniones.</p>';
  }
  if (formValoracion) {
    formValoracion.onsubmit = async (e) => {
      e.preventDefault();
      if (!idUsuario) {
        if (alertaValoracion) {
          alertaValoracion.className = 'auth-alerta error';
          alertaValoracion.textContent = 'Debes iniciar sesión para publicar tu opinión.';
          alertaValoracion.style.display = 'block';
        }
        return;
      }

      if (!calificacionSeleccionada || calificacionSeleccionada < 1 || calificacionSeleccionada > 5) {
        if (alertaValoracion) {
          alertaValoracion.className = 'auth-alerta error';
          alertaValoracion.textContent = 'Por favor selecciona una puntuación de 1 a 5 estrellas.';
          alertaValoracion.style.display = 'block';
        }
        return;
      }

      const comentario = txtComentario ? txtComentario.value.trim() : '';
      const btnSubmit = document.getElementById('btn-submit-valoracion');
      if (btnSubmit) btnSubmit.disabled = true;

      try {
        const guardado = await guardarValoracionMazoAPI(idMazo, {
          id_usuario: Number(idUsuario),
          puntuacion: calificacionSeleccionada,
          comentario: comentario
        });

        if (guardado && guardado.exito) {
          if (alertaValoracion) {
            alertaValoracion.className = 'auth-alerta exito';
            alertaValoracion.textContent = guardado.mensaje || '¡Opinión guardada con éxito!';
            alertaValoracion.style.display = 'block';
          }
          await cargarValoracionesMazo(idMazo);
          if (typeof cargarGaleriaMazos === 'function') cargarGaleriaMazos();
        } else {
          if (alertaValoracion) {
            alertaValoracion.className = 'auth-alerta error';
            alertaValoracion.textContent = guardado.mensaje || 'Error al guardar la opinión.';
            alertaValoracion.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Error al enviar valoración:', err);
        if (alertaValoracion) {
          alertaValoracion.className = 'auth-alerta error';
          alertaValoracion.textContent = 'Error de conexión con el servidor.';
          alertaValoracion.style.display = 'block';
        }
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
      }
    };
  }
}

async function eliminarValoracionMazoHandler(idValoracion, idMazo) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return;
  try {
    const res = await eliminarValoracionAPI(idValoracion);
    if (res && res.exito) {
      await cargarValoracionesMazo(idMazo);
      if (typeof cargarGaleriaMazos === 'function') cargarGaleriaMazos();
    } else {
      alert(res.mensaje || 'Error al eliminar valoración.');
    }
  } catch (err) {
    console.error('Error al eliminar valoración:', err);
    alert('Error al conectar con el servidor.');
  }
}
