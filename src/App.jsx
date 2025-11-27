import React, { useState, useEffect } from 'react';
import { 
  Menu, User, ShoppingCart, Drumstick, Gift, History, 
  ChevronRight, Settings, Plus, Trash2, Edit2, X, Save, CreditCard, Loader, QrCode, Smartphone, MapPin, Phone, Clock 
} from 'lucide-react';

// หมายเหตุ: เราลบ import liff ออกและจะใช้ window.liff จาก CDN แทนเพื่อแก้ปัญหาการคอมไพล์
// import liff from '@line/liff'; 

// --- CONFIGURATION ---
const OMISE_PUBLIC_KEY = 'pkey_test_5w885d5s77864808'; 
const MY_LIFF_ID = '2008579350-zOxlbkRy'; // LIFF ID ของคุณ

// ข้อมูลเริ่มต้น
const INITIAL_MENU = [
  {
    id: 1,
    name: 'ไก่ป๊อป',
    price: 39,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
    description: 'กรอบนอก นุ่มใน'
  },
  {
    id: 2,
    name: 'นักเก็ต',
    price: 49,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
    description: 'เนื้อแน่น เต็มคำ'
  },
  {
    id: 3,
    name: 'ไก่ทอดสไปซี่',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1606843046080-45bf7a23c39f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
    description: 'เผ็ดจัดจ้าน'
  },
  {
    id: 4,
    name: 'เฟรนช์ฟรายส์',
    price: 29,
    imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
    description: 'ทอดใหม่ทุกออเดอร์'
  }
];

const ORDER_HISTORY = [
  { id: 'ORD-001', date: '26 พ.ย. 66', items: 'ไก่ป๊อป x 2', total: 78 },
  { id: 'ORD-002', date: '25 พ.ย. 66', items: 'นักเก็ต x 1', total: 49 },
];

export default function App() {
  // State หลัก
  const [points, setPoints] = useState(320);
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  
  // State สำหรับ User Profile (LINE)
  const [userProfile, setUserProfile] = useState(null);
  const [liffError, setLiffError] = useState(null);
  const [liffReady, setLiffReady] = useState(false);

  // State สำหรับโหมด Admin
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // State สำหรับ Flow การสั่งซื้อ
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isPaymentSelectionOpen, setIsPaymentSelectionOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null); 
  
  // State สำหรับ Omise
  const [omiseLoaded, setOmiseLoaded] = useState(false);

  // ฟอร์มข้อมูลสินค้า (Admin)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
    description: ''
  });

  // ฟอร์มข้อมูลลูกค้า
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // รายการที่อยู่เก่าที่บันทึกไว้
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Initialization Effect
  useEffect(() => {
    // 1. โหลด LIFF SDK via CDN (เพื่อให้ทำงานได้โดยไม่ต้อง npm install @line/liff ในบาง environment)
    const initLiffSDK = () => {
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.onload = async () => {
            try {
                // ใช้ window.liff แทน
                await window.liff.init({ liffId: MY_LIFF_ID });
                setLiffReady(true);
                
                // ตรวจสอบสถานะการล็อกอิน
                if (window.liff.isLoggedIn()) {
                    // API Call: liff.getProfile() จะรวม displayName, pictureUrl, userId
                    // API Call: liff.getDecodedIDToken() จะรวม email (ถ้าขอสิทธิ์ไว้)
                    const profile = await window.liff.getProfile();
                    
                    let email = null;
                    if (window.liff.getDecodedIDToken()) {
                        email = window.liff.getDecodedIDToken().email;
                    }

                    setUserProfile({ ...profile, email });
                } else {
                    // ไม่ต้องเรียก liff.login() อัตโนมัติ เพราะจะไปแสดงปุ่มให้ลูกค้ากดเอง
                }
            } catch (error) {
                console.error('LIFF Init Failed:', error);
                // แสดงข้อความ error ที่ชัดเจนขึ้น
                setLiffError(`LIFF Initialization Error: ${error.message || error.toString()}. Please check your LIFF ID and Scopes in LINE Console.`);
            }
        };
        document.body.appendChild(script);
    };
    initLiffSDK();

    // 2. โหลดที่อยู่เดิม
    const saved = localStorage.getItem('chickenShop_savedAddresses');
    if (saved) {
      setSavedAddresses(JSON.parse(saved));
    }

    // 3. โหลด Omise
    const scriptOmise = document.createElement('script');
    scriptOmise.src = 'https://cdn.omise.co/omise.js';
    scriptOmise.async = true;
    scriptOmise.onload = () => {
      setOmiseLoaded(true);
      if (window.OmiseCard) {
        window.OmiseCard.configure({
          publicKey: OMISE_PUBLIC_KEY,
          image: 'https://images.unsplash.com/photo-1513639776629-c261165cd877?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
          frameLabel: 'ไก่ทอดสมหวัง สาขาพระราม 5',
          submitLabel: 'ชำระเงิน',
          buttonLabel: 'Pay with Omise'
        });
      }
    };
    document.body.appendChild(scriptOmise);

    return () => {
      // Cleanup scripts if needed (optional)
    }
  }, []);

  const handleLogin = () => {
    if (window.liff) {
        window.liff.login();
    }
  };

  // --- Functions สำหรับจัดการเมนู (Admin) ---

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', imageUrl: '', description: '' });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบเมนูนี้?')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (editingItem) {
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? { ...formData, id: item.id, price: Number(formData.price) } : item
      ));
    } else {
      const newItem = {
        ...formData,
        id: Date.now(),
        price: Number(formData.price)
      };
      setMenuItems([...menuItems, newItem]);
    }
    setIsModalOpen(false);
  };

  // --- Functions สำหรับตะกร้าสินค้า ---

  const addToCart = (item) => {
    if (isAdminMode) return;
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  };

  // Step 1: คลิกยืนยันจากตะกร้า -> ไปหน้ากรอกข้อมูลลูกค้า
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    
    // Auto-fill Logic:
    if (savedAddresses.length > 0) {
      setCustomerInfo(savedAddresses[0]);
    } else if (userProfile) {
      setCustomerInfo(prev => ({ ...prev, name: userProfile.displayName }));
    }

    setIsCartOpen(false); // ปิดตะกร้า
    setIsCustomerFormOpen(true); // เปิดหน้ากรอกข้อมูล
  };

  // ฟังก์ชันเลือกใช้ที่อยู่เก่า
  const handleSelectAddress = (address) => {
    setCustomerInfo(address);
  };

  // Step 2: กรอกข้อมูลเสร็จ -> บันทึกข้อมูลและไปหน้าเลือกวิธีชำระเงิน
  const handleCustomerFormSubmit = (e) => {
    e.preventDefault();
    
    // Logic การบันทึกที่อยู่
    const newAddress = customerInfo;
    let updatedAddresses = [newAddress, ...savedAddresses.filter(a => a.address !== newAddress.address)];
    updatedAddresses = updatedAddresses.slice(0, 3); 
    
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('chickenShop_savedAddresses', JSON.stringify(updatedAddresses));

    setIsCustomerFormOpen(false);
    setIsPaymentSelectionOpen(true);
  };

  // Step 3: เลือกวิธีชำระเงิน -> เรียก Omise
  const processPayment = (method) => {
    setIsPaymentSelectionOpen(false);

    if (!omiseLoaded || !window.OmiseCard) {
      alert("กำลังโหลดระบบชำระเงิน กรุณารอสักครู่...");
      return;
    }

    const totalAmount = calculateTotal() * 100; // Omise หน่วยเป็นสตางค์

    window.OmiseCard.open({
      amount: totalAmount,
      currency: 'THB',
      defaultPaymentMethod: method,
      onCreateTokenSuccess: (nonce) => {
        console.log("Omise Token:", nonce);
        console.log("Customer Info:", customerInfo); 
        
        // ส่งข้อความกลับเข้า LINE
        if (window.liff && window.liff.isInClient()) {
            window.liff.sendMessages([
                {
                    type: 'text',
                    text: `สั่งซื้อสำเร็จ!\nเมนู: ${cart.map(i => i.name).join(', ')}\nรวม: ${calculateTotal()} บาท`
                }
            ]).catch(err => console.error("Error sending message", err));
        }

        setTimeout(() => {
          alert(
            `✅ สั่งซื้อสำเร็จ!\n\n` +
            `คุณ: ${customerInfo.name} (LINE: ${userProfile?.displayName})\n` +
            `โทร: ${customerInfo.phone}\n` +
            `ที่อยู่: ${customerInfo.address}\n\n` +
            `Ref Payment: ${nonce.substring(0, 10)}...`
          );
          setCart([]);
          setCustomerInfo({ name: '', phone: '', address: '' }); // Reset Form
        }, 1000);
      },
      onFormClosed: () => {
        // setIsPaymentSelectionOpen(true); 
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-24 relative">
      
      {/* Header */}
      <nav className={`px-4 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 transition-colors ${isAdminMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-full transition-colors ${isAdminMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{isAdminMode ? 'จัดการร้านค้า' : 'หน้าหลัก'}</h1>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`p-2 rounded-full transition-colors ${isAdminMode ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            title="สลับโหมดจัดการเมนู"
          >
            <Settings className="w-5 h-5" />
          </button>

          {!isAdminMode && (
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {userProfile?.pictureUrl ? (
                    <img src={userProfile.pictureUrl} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        <User className="w-5 h-5 text-gray-500" />
                    </div>
                )}
              </button>
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cart.length}
                </span>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Admin Warning Banner */}
      {isAdminMode && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">
          🔧 คุณกำลังอยู่ในโหมดจัดการเมนู
        </div>
      )}

      {/* LIFF Error / Login Prompt */}
      {(!userProfile && !isAdminMode && liffReady) && (
        <div className="bg-blue-50 p-4 mx-4 mt-4 rounded-xl border border-blue-100 flex justify-between items-center">
             <div className="text-sm text-blue-800">
                {liffError ? liffError : 'เข้าสู่ระบบเพื่อสะสมแต้ม'}
             </div>
             {/* ซ่อนปุ่ม Login ถ้ามี Error หรือล็อกอินแล้ว */}
             {!liffError && (
                 <button onClick={handleLogin} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                    Login with LINE
                 </button>
             )}
        </div>
      )}
      
      {/* Loading State for LIFF (ตอนที่รอโหลด SDK) */}
      {!liffReady && (
        <div className="p-4 mx-4 mt-4 text-center text-gray-500 flex items-center justify-center gap-2">
          <Loader className="w-5 h-5 animate-spin" /> กำลังโหลดระบบ LIFF...
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Points Card (Show only for Customer) */}
        {!isAdminMode && (
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
              
              {/* Profile Header in Card */}
              <div className="flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="w-12 h-12 rounded-full border-2 border-white/40 overflow-hidden shadow-inner bg-white/10">
                    {userProfile?.pictureUrl ? (
                        <img src={userProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-white/70" /></div>
                    )}
                </div>
                <div>
                    <p className="text-green-100 text-[10px] font-medium uppercase tracking-wider">Welcome Member</p>
                    <h3 className="font-bold text-lg text-white leading-tight">
                        {userProfile ? userProfile.displayName : 'Guest'}
                    </h3>
                    {/* เพิ่ม Email ตรงนี้เพื่อยืนยันว่าดึงข้อมูลได้ */}
                    {userProfile?.email && (
                         <p className="text-xs text-white/80 opacity-90 truncate">Email: {userProfile.email}</p>
                    )}
                </div>
              </div>

              <div className="w-full h-px bg-white/20 mb-4"></div>

              <h2 className="text-sm font-medium opacity-90 mb-1">แต้มสะสม</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">{points}</span>
                <span className="text-sm opacity-80">แต้ม</span>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                  ระดับ: Gold Member
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Drumstick className="w-5 h-5 text-green-600" />
              {isAdminMode ? 'รายการสินค้าทั้งหมด' : 'เมนูแนะนำ'}
            </h2>
            {!isAdminMode && <button className="text-xs text-green-600 font-medium hover:underline">ดูทั้งหมด</button>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Add New Item Button (Admin Only) */}
            {isAdminMode && (
              <button 
                onClick={handleAddNewClick}
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-green-500 hover:text-green-600 transition-all min-h-[160px]"
              >
                <Plus className="w-10 h-10 mb-2" />
                <span className="font-bold text-sm">เพิ่มเมนู</span>
              </button>
            )}

            {menuItems.map((item) => (
              <div key={item.id} className="relative group">
                <div 
                  onClick={() => !isAdminMode && addToCart(item)}
                  className={`bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center h-full border border-transparent transition-all duration-200 
                    ${isAdminMode ? '' : 'hover:bg-green-50 hover:border-green-200 cursor-pointer active:scale-95'}`}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-32 h-32 object-cover rounded-lg mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110"
                  />
                  <h3 className="font-bold text-gray-800 text-center line-clamp-1">{item.name}</h3>
                  <p className="text-green-600 font-bold text-sm">{item.price} ฿</p>
                  
                  {isAdminMode && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md transform hover:scale-110 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transform hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isAdminMode && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95 transform duration-150"
            >
              <ShoppingCart className="w-5 h-5" />
              ไปที่ตะกร้า ({cart.reduce((sum, item) => sum + item.price, 0)} ฿)
            </button>
          )}
        </div>

        {/* Rewards Section */}
        {!isAdminMode && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              แลกของรางวัล
            </h2>
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100 mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">🥤</div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">ฟรี เป๊ปซี่ 1 แก้ว</p>
                   <p className="text-xs text-gray-500">ใช้ 100 แต้ม</p>
                 </div>
               </div>
               <button className="px-3 py-1 bg-white text-green-600 text-xs font-bold border border-green-600 rounded-full hover:bg-green-600 hover:text-white transition-colors">
                 แลก
               </button>
            </div>
          </div>
        )}

        {/* History Section */}
        {!isAdminMode && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-green-600" />
              ประวัติการสั่งซื้อ
            </h2>
            <div className="space-y-3">
              {ORDER_HISTORY.map((order) => (
                <div key={order.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-gray-800">{order.items}</span>
                       <span className="text-xs text-gray-400">| {order.date}</span>
                    </div>
                    <p className="text-xs text-gray-500">หมายเลข: {order.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">{order.total} ฿</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Customer Info Form (New!) */}
      {isCustomerFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 bg-white z-10">
                <h3 className="font-bold text-lg text-gray-800">ข้อมูลจัดส่ง</h3>
                <button 
                  onClick={() => setIsCustomerFormOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
             </div>
             
             <div className="p-6 space-y-4">
                {/* Saved Addresses Section */}
                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" /> เลือกที่อยู่เดิม
                    </label>
                    <div className="space-y-2">
                      {savedAddresses.map((addr, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleSelectAddress(addr)}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-green-50 hover:border-green-200 cursor-pointer transition-all active:scale-95 group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-gray-800 group-hover:text-green-700">{addr.name}</span>
                            <span className="text-xs text-gray-400">{addr.phone}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 group-hover:text-green-600">{addr.address}</p>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">หรือกรอกใหม่</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCustomerFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> ชื่อ-นามสกุล
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="สมชาย ใจดี"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> เบอร์โทรศัพท์
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" /> ที่อยู่จัดส่ง
                      </label>
                      <textarea 
                        required
                        rows="3"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="บ้านเลขที่, ซอย, ถนน..."
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        ไปหน้าชำระเงิน <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                </form>
             </div>
           </div>
        </div>
      )}

      {/* MODAL: Payment Selection */}
      {isPaymentSelectionOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">เลือกวิธีการชำระเงิน</h3>
                <button 
                  onClick={() => setIsPaymentSelectionOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
             </div>
             
             {/* Show Summary Info */}
             <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
               <p><strong>จัดส่งไปที่:</strong> {customerInfo.name}</p>
               <p className="truncate">{customerInfo.address}</p>
             </div>

             <div className="p-4 space-y-3">
                <button 
                  onClick={() => processPayment('promptpay')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-800">สแกนจ่าย (PromptPay)</h4>
                    <p className="text-xs text-gray-500">สแกน QR Code เพื่อชำระเงิน</p>
                  </div>
                </button>

                <button 
                  onClick={() => processPayment('credit_card')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-800">บัตรเครดิต / เดบิต</h4>
                    <p className="text-xs text-gray-500">Visa, Mastercard, JCB</p>
                  </div>
                </button>

                <button 
                  onClick={() => processPayment('truemoney')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-800">TrueMoney Wallet</h4>
                    <p className="text-xs text-gray-500">จ่ายผ่านแอป TrueMoney</p>
                  </div>
                </button>
             </div>
           </div>
        </div>
      )}

      {/* MODAL: Cart */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl h-[80vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
             {/* Cart Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-lg text-gray-800">ตะกร้าสินค้า</h3>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 opacity-50" />
                  </div>
                  <p>ยังไม่มีสินค้าในตะกร้า</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-green-600 font-bold hover:underline"
                  >
                    กลับไปเลือกสินค้า
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                        <p className="text-green-600 text-sm">{item.price} ฿</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">ยอดรวมทั้งหมด</span>
                  <span className="text-2xl font-bold text-green-600">{calculateTotal()} ฿</span>
                </div>
                <button 
                  onClick={handleCheckoutClick}
                  disabled={!omiseLoaded}
                  className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95 transform duration-150
                    ${omiseLoaded ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  {omiseLoaded ? 'ยืนยันการสั่งซื้อ' : 'กำลังโหลดระบบ...'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="เช่น ไก่กรอบซอสเกาหลี"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ</label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสั้นๆ</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="เช่น รสชาติกลมกล่อม"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Summary Bar (Customer Only) */}
      {!isAdminMode && cart.length > 0 && (
         <div 
           onClick={() => setIsCartOpen(true)}
           className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 fade-in duration-300"
         >
            <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {cart.length}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">รวมทั้งหมด</span>
                  <span className="font-bold text-green-400">{cart.reduce((sum, item) => sum + item.price, 0)} ฿</span>
                </div>
              </div>
              <span className="font-bold text-sm bg-white/10 px-3 py-1.5 rounded-lg">ดูตะกร้า</span>
            </div>
         </div>
      )}
    </div>
  );
}