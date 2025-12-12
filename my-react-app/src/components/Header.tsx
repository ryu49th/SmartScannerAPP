export default function Header() {
  return (
    <header className="bg-red-600 text-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto max-w-md flex justify-center items-center">
        <div className="flex items-center text-center">
          <div>
            <h1 className="font-bold leading-tight">Smart Scanner</h1>
            <p className="text-xs text-red-100 opacity-80">Inventory System</p>
          </div>
        </div>
      </div>
    </header>
  );
}