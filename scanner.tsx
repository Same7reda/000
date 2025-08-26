import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Helper Hooks & Types ---
type Product = {
    id: string; name: string; price: number; stock: number; barcode: string;
    cost: number; category: string; unit: string; supplier?: string;
};
type FirebaseConfig = { apiKey: string; authDomain: string; databaseURL: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string; };
type Page = 'products' | 'scanner';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  return [storedValue, setStoredValue];
}

// --- Icons ---
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.89 1.453a2.2 2.2 0 0 0-1.78 0l-6 3A2.2 2.2 0 0 0 4 6.425v11.15a2.2 2.2 0 0 0 1.11 1.972l6 3a2.2 2.2 0 0 0 1.78 0l6-3a2.2 2.2 0 0 0 1.11-1.972V6.425a2.2 2.2 0 0 0-1.11-1.972l-6-3Z"/><path d="m4.22 6.55 7.78 3.9 7.78-3.9"/><path d="M12 22.42V10.5"/></svg>
);
const QrCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const ScanLineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...props}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
);
const CameraOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><line x1="1" y1="1" x2="23" y2="23"></line><circle cx="12" cy="13" r="3"></circle></svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);


// --- Components ---
const ProductDetailModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
    const currencyFormat = (amount: number) => amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-3 text-gray-600">
                    <p className="flex justify-between"><span>السعر:</span> <span className="font-bold text-lg text-purple-700">{currencyFormat(product.price)}</span></p>
                    <p className="flex justify-between"><span>التكلفة:</span> <span>{currencyFormat(product.cost)}</span></p>
                    <p className="flex justify-between"><span>المخزون:</span> <span>{product.stock} {product.unit}</span></p>
                    <p className="flex justify-between"><span>الفئة:</span> <span>{product.category}</span></p>
                    <p className="flex justify-between"><span>المورد:</span> <span>{product.supplier || '-'}</span></p>
                    <p className="pt-2 border-t font-mono text-center text-lg tracking-widest">{product.barcode}</p>
                </div>
            </div>
        </div>
    );
};

const ScannerView: React.FC<{ onProductFound: (product: Product) => void, localProducts: Product[] }> = ({ onProductFound, localProducts }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);
    const [status, setStatus] = useState('idle'); // idle, starting, active, error
    const [scanSuccess, setScanSuccess] = useState(false);
    const scanSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        scanSoundRef.current = new Audio("https://cdn.jsdelivr.net/gh/pixel-guy/pixel-assets/scan.mp3");
        codeReaderRef.current = new (window as any).ZXing.BrowserMultiFormatReader();
        
        startCamera(); // Auto-start camera on component mount

        return () => codeReaderRef.current?.reset();
    }, []);

    const startCamera = async () => {
        setStatus('starting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStatus('active');
                codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result: any, err: any) => {
                    if (result && !scanSuccess) {
                        setScanSuccess(true);
                        scanSoundRef.current?.play();
                        const foundProduct = localProducts.find(p => p.barcode === result.getText());
                        if (foundProduct) {
                            onProductFound(foundProduct);
                        }
                        setTimeout(() => setScanSuccess(false), 1000); // Prevent rapid re-scans
                    }
                });
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="relative w-full h-full bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            {status !== 'active' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4 text-center">
                    {status === 'idle' && <button onClick={startCamera} className="bg-purple-600 px-6 py-3 rounded-lg font-bold text-lg flex items-center gap-3"><CameraOffIcon className="w-6 h-6"/> تشغيل الكاميرا</button>}
                    {status === 'starting' && <p>جاري تشغيل الكاميرا...</p>}
                    {status === 'error' && <p>حدث خطأ. يرجى السماح بالوصول إلى الكاميرا.</p>}
                </div>
            )}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-sm h-32 border-4 ${scanSuccess ? 'border-green-400 shadow-2xl shadow-green-400/50' : 'border-white/80'} rounded-2xl transition-all duration-300`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent ${status === 'active' ? 'animate-scan' : ''}`} />
                 <style>{`@keyframes scan { 0% { top: 0; } 100% { top: 100%; } } .animate-scan { animation: scan 2s linear infinite; }`}</style>
            </div>
        </div>
    );
};

const ProductsView: React.FC<{ products: Product[], onProductClick: (p: Product) => void }> = ({ products, onProductClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerCaseSearch) ||
            p.barcode.includes(lowerCaseSearch) ||
            p.category.toLowerCase().includes(lowerCaseSearch) ||
            p.supplier?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [products, searchTerm]);

    return (
        <div className="p-4 pb-20">
            <div className="relative mb-4">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="ابحث بالاسم, الباركود, الفئة..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-10 focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => onProductClick(p)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer active:scale-95 transition-transform">
                            <h3 className="font-bold text-gray-800 truncate">{p.name}</h3>
                            <p className="text-purple-600 font-semibold">{p.price.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p>
                            <p className="text-sm text-gray-500">المخزون: {p.stock} {p.unit}</p>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 text-gray-500">
                    <PackageIcon className="w-16 h-16 mx-auto text-gray-300 mb-2"/>
                    <p>{products.length === 0 ? "لا توجد منتجات مزامنة بعد." : "لم يتم العثور على منتجات."}</p>
                </div>
            )}
        </div>
    );
};

const BottomNav: React.FC<{ active: Page; onNavigate: (page: Page) => void }> = ({ active, onNavigate }) => {
    const navItems = [
        { page: 'products' as Page, label: 'المنتجات', icon: <PackageIcon className="w-6 h-6" /> },
        { page: 'scanner' as Page, label: 'الماسح', icon: <ScanLineIcon className="w-6 h-6" /> },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex justify-around h-16">
            {navItems.map(item => (
                <button key={item.page} onClick={() => onNavigate(item.page)} className={`flex flex-col items-center justify-center w-full transition-colors ${active === item.page ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'}`}>
                    {item.icon}
                    <span className="text-xs font-semibold">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const LoadingScreen: React.FC<{ statusText: string }> = ({ statusText }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-purple-700 to-blue-700 text-white">
        <div className="text-center">
            <QrCodeIcon className="w-24 h-24 mx-auto mb-6 text-white/80 animate-pulse" />
            <h1 className="text-3xl font-bold mb-4">تطبيق الماسح الضوئي</h1>
            <p className="text-lg text-white/70">{statusText}</p>
        </div>
    </div>
);

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('products');
    const [localProducts, setLocalProducts] = useLocalStorage<Product[]>('scanner-products', []);
    const [status, setStatus] = useState('initializing');
    const [statusText, setStatusText] = useState('جاري التجهيز...');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const initialize = async () => {
            setStatusText('تحليل الإعدادات...');
            const params = new URLSearchParams(window.location.search);
            const config: Partial<FirebaseConfig> = {};
            ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach(key => {
                if (params.has(key)) config[key as keyof FirebaseConfig] = params.get(key)!;
            });

            if (Object.keys(config).length < 7) {
                setStatusText('بيانات الربط غير مكتملة. يرجى إعادة المسح من النظام الرئيسي.');
                setStatus('error');
                return;
            }

            try {
                setStatusText('الاتصال بـ Firebase...');
                if (!(window as any).firebase.apps.length) {
                    (window as any).firebase.initializeApp(config);
                }
                const db = (window as any).firebase.database();
                const productsRef = db.ref('syncedData/products');
                
                setStatusText('جلب البيانات...');
                productsRef.on('value', (snapshot: any) => {
                    const data = snapshot.val();
                    if (data && Array.isArray(data)) {
                        setLocalProducts(data);
                    }
                    setStatus('connected');
                }, (error: any) => {
                    console.error(error);
                    setStatusText('فشل الاتصال بقاعدة البيانات. تحقق من الإعدادات.');
                    setStatus('error');
                });

            } catch (e) {
                console.error(e);
                setStatusText('فشل تهيئة الاتصال. يرجى المحاولة مرة أخرى.');
                setStatus('error');
            }
        };
        initialize();
    }, []);

    const handleProductFound = (product: Product) => {
        setSelectedProduct(product);
        setActivePage('products');
    };

    if (status !== 'connected') {
        return <LoadingScreen statusText={statusText} />;
    }

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col">
            <main className="flex-1 overflow-y-auto bg-gray-100">
                {activePage === 'products' && <ProductsView products={localProducts} onProductClick={setSelectedProduct} />}
                {activePage === 'scanner' && <ScannerView onProductFound={handleProductFound} localProducts={localProducts} />}
            </main>
            <BottomNav active={activePage} onNavigate={setActivePage} />
            {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        </div>
    );
};


// A simple promise-based utility to wait for a global variable.
const waitForGlobal = (name: string): Promise<any> => new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100; // 100 * 50ms = 5 seconds timeout
    const check = () => {
        if ((window as any)[name]) {
            resolve((window as any)[name]);
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, 50);
        } else {
            reject(new Error(`'${name}' لم يتم تحميل المكتبة في الوقت المناسب.`));
        }
    };
    check();
});

// Main application entry point
async function main() {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        console.error("Fatal Error: Root element not found.");
        // Fallback UI in case React cannot mount
        document.body.innerHTML = `<div style="text-align:center; padding-top: 50px; color: red;">فشل بدء التطبيق: العنصر الجذر مفقود.</div>`;
        return;
    }

    const root = ReactDOM.createRoot(rootElement);

    try {
        // Wait for external libraries before attempting to render the main app
        await Promise.all([
            waitForGlobal('firebase'),
            waitForGlobal('ZXing'),
        ]);

        // Once libraries are loaded, render the main React application
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    } catch (error) {
        console.error("Failed to initialize scanner app:", error);
        // If libraries fail to load, show an error message using the same React root
        root.render(<LoadingScreen statusText={`فشل تحميل التطبيق: ${error}. يرجى التحقق من اتصال الإنترنت.`} />);
    }
}

// Run the main entry point
main();