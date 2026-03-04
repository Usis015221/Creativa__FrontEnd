import './ImageUser.css'

function ImageUser(prop) {
    return (
        <div className={prop.nameContainer}>
            <div className={prop.name}>{prop.Initials}</div>
        </div>
    );
}
export default ImageUser;