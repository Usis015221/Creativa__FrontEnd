import './Cards.css';
import { Clock } from 'lucide-react';

function Cards(props) {
	var color = 'var(--color-proceso)';
	const estado = props.estado;

	if (estado === 'Enviado') {
		color = 'var(--color-proceso)';
	} else if (estado === 'Cancelado') {
		color = 'var(--color-cancelado)';
	} else if (estado === 'Aprobado') {
		color = 'var(--color-aprobado)';
	} else if (estado === 'Rechazado') {
		color = 'var(--color-rechazado)';
	}

	// Eliminamos la lógica del localStorage. 
	// Ahora dependemos 100% de lo que el componente padre mande en props.usuario
	const userName = props.usuario || 'Diseñador';
	const initial = userName.charAt(0).toUpperCase();

	return (
		<div className="cards-container" onClick={props.onClick}>
			<Clock className='imgCard' />
			<div className='InfoCard'>
				<h4>{props.titulo}</h4>
				<div className="progreso">
					<div className='Estado' style={{ backgroundColor: color, color: color }}></div>
					{props.estado}
				</div>
				<div className="fecha">
					{/* AVATAR ESTILO WHATSAPP PARA LAS CARDS */}
					<div style={{
						width: '24px',
						height: '24px',
						borderRadius: '50%',
						backgroundColor: '#00a884',
						color: 'white',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '12px',
						fontWeight: 'bold',
						marginRight: '8px'
					}}>
						{initial}
					</div>
					{/* Renderizamos el nombre. Si no viene nada, dirá "Diseñador" */}

					<p>{props.fecha}</p>
				</div>
			</div>
		</div>
	);
}
export default Cards;