import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const HalamanPenjual = async () => {
  const session = await auth();
  return (
    <div className="min-h-screen mx-6 p-6 flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">
        Hey welcome back {session?.user.name}!
      </h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
          <CardDescription>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nulla
            ratione dignissimos eveniet sit reiciendis! Iusto doloremque ratione
            sit unde odio.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card className="w-full h-full border border-green-400 text-green-500">
            <CardContent className="flex h-full w-full items-center text-xs">
              <span className="font-semibold">10 Pesanan&nbsp;</span> perlu di
              konfirmasi
            </CardContent>
          </Card>
          <Card className="w-full h-full border border-amber-400 text-amber-400">
            <CardContent className="flex h-full w-full items-center text-xs">
              <span className="font-semibold">4 Pesanan&nbsp;</span> siap
              dikirim
            </CardContent>
          </Card>
          <Card className="w-full h-full border  border-red-400 text-red-400">
            <CardContent className="flex h-full w-full items-center text-xs">
              <span className="font-semibold">80 Product&nbsp;</span> kehabisan
              stock
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default HalamanPenjual;
