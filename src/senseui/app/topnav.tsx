import Image from "next/image";
import SenseLogo from '../public/sense.png'

export default function TopNav() {
    return (
        <nav className="sticky flex items-center justify-between p-4 bg-(--primary-blue) mb-4 shadow-2xl">
            <div>
                <Image src={SenseLogo} alt="Sense logo" width="200" />
            </div>
        </nav>
    );
}