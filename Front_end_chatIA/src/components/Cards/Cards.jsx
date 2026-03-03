import './Cards.css';
import { Clock, CircleUser } from 'lucide-react';

function Cards(props) {
	var color = 'var(--color-proceso)';
	const estado = props.estado;
	// console.log(props) // Removed console log for cleaner code
	if (estado === 'Enviado') {
		color = 'var(--color-proceso)';
	} else if (estado === 'Cancelado') {
		color = 'var(--color-cancelado)';
	} else if (estado === 'Aprobado') {
		color = 'var(--color-aprobado)';
	} else if (estado === 'Rechazado') {
		color = 'var(--color-rechazado)';
	}



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
					<CircleUser className='FotoUser' />
					<p>{props.usuario}</p>
					<p>{props.fecha}</p>
				</div>
			</div>
		</div>
	);
}
export default Cards;