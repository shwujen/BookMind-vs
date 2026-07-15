import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Star, Plus, Trash2, Search, Filter, 
  RotateCcw, CheckCircle, Edit3, Bookmark, MessageSquare, ChevronRight
} from 'lucide-react';
import { Marked } from 'marked';

const marked = new Marked();

const pickValue = (source, keys) => {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
};

const normalizeDateValue = (rawValue) => {
  if (!rawValue) return '';
  const value = String(rawValue).trim();
  if (!value) return '';

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Try parsing date-like strings without shifting to UTC
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return value;
};

const parseAddDate = (rawBook) => {
  const value = pickValue(rawBook, ['addDate', 'add_date', 'createdAt', 'created_at', 'date', '加入日期']);
  const normalized = normalizeDateValue(value);
  if (normalized) {
    return normalized;
  }

  // Look for date-like keys or values in Google Apps Script format
  for (const key of Object.keys(rawBook || {})) {
    const value = rawBook[key];
    if (typeof key === 'string' && /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(key)) {
      const parsed = normalizeDateValue(value);
      if (parsed) return parsed;
    }
    if (typeof value === 'string' && /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(value)) {
      const parsed = normalizeDateValue(value);
      if (parsed) return parsed;
    }
  }

  return '';
};

const parseModDate = (rawBook, fallbackDate = '') => {
  const management = rawBook?.management && typeof rawBook.management === 'object' ? rawBook.management : {};
  const value = pickValue(management, ['modDate', 'modifiedAt', 'updatedAt', '修改日期', 'date', '加入日期']);
  const normalized = normalizeDateValue(value);
  return normalized || normalizeDateValue(fallbackDate) || '';
};

// 為 Google Sheets 列對應創建更清晰的映射
const getColumnValue = (sheet, colNames) => {
  if (!sheet || typeof sheet !== 'object') return '';
  
  // 嘗試每個可能的列名，包含原本的英文欄位與新設的中文標頭
  for (const name of colNames) {
    const value = sheet[name];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const getColumnNumber = (sheet, colNames) => {
  const value = getColumnValue(sheet, colNames);
  return value ? Number(value) : 0;
};

const normalizeBook = (rawBook) => {
  if (!rawBook || typeof rawBook !== 'object') return null;

  const management = rawBook.management && typeof rawBook.management === 'object' ? rawBook.management : {};
  
  // 書籍基本資訊 - 試試多種可能的列名
  const bookId = getColumnValue(rawBook, ['bookId', 'id', 'test1', 'BookId', 'ID', '書籍ID']) || 
                 getColumnValue(management, ['bookId', 'test1', '書籍ID']) ||
                 `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const bookName = getColumnValue(rawBook, ['bookName', 'title', 'BookName', 'TestBook', 'name', 'book_name', '書名', '書籍名稱']) || '未命名項目';
  const author = getColumnValue(rawBook, ['author', 'Author', 'TestAuthor', 'authorName', 'writer', '作者', '導演', '作者/導演']);
  const publicer = getColumnValue(rawBook, ['publicer', 'publisher', 'TestPublisher', 'source', 'publisherName', '出版社', '來源', '來源/出版社']);
  const category = getColumnValue(rawBook, ['category', 'BookType', 'type', 'kind', '分類', '類別']) || '書籍';
  const tag = getColumnValue(rawBook, ['tag', 'tags', 'Tag', 'test', '標籤', '標簽']);
  const addDate = normalizeDateValue(parseAddDate(rawBook) || getColumnValue(rawBook, ['加入日期', 'addDate', 'date']));
  
  // 管理資訊 - Google Sheets 使用數字列或中文標頭
  const progress = getColumnNumber(management, ['0', 'progress', 'Progress', '進度', '閱讀進度']) || 0;
  const status = getColumnValue(management, ['reading', 'status', 'Status', 'state', '閱讀狀態', '狀態']) || '待讀';
  const rating = getColumnNumber(management, ['4', 'rating', 'Rating', '評分']) || 5;
  const notes = getColumnValue(management, ['test notes', 'notes', 'note', 'Notes', 'content', '心得', '筆記', '心得筆記']) || '';

  return {
    ...rawBook,
    bookId,
    bookName,
    author: author || '',
    publicer: publicer || '',
    category,
    tag: tag || '',
    addDate,
    management: {
      ...management,
      No: getColumnValue(management, ['No', 'no', 'index', '編號']) || '',
      bookId,
      progress: Number.isFinite(progress) ? progress : 0,
      status,
      rating: Number.isFinite(rating) ? rating : 5,
      notes,
      modDate: normalizeDateValue(parseModDate(rawBook, addDate)) || addDate || ''
    }
  };
};

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success'|'error', message: string }

  // 表單資料
  const [formData, setFormData] = useState({
    bookName: '',
    author: '',
    publicer: '',
    category: '書籍',
    tag: '',
    addDate: new Date().toISOString().split('T')[0],
    progress: 0,
    status: '待讀',
    rating: 5,
    notes: ''
  });

  const GAS_URL = import.meta.env.VITE_GAS_URL || '/gas';

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GAS_URL}?action=list`);
      const text = await res.text();
      const parsed = JSON.parse(text);
      const rawBooks = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.books)
          ? parsed.books
          : Array.isArray(parsed?.data)
            ? parsed.data
            : [];

      const normalizedBooks = rawBooks
        .map(normalizeBook)
        .filter(Boolean);

      setBooks(normalizedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'progress' || name === 'rating' ? Number(value) : value
    }));
  };

  const buildBookPayload = (action, formData, selectedBook, bookId, today) => {
    const normalizedBook = {
      action,
      bookId,
      id: bookId,
      title: formData.bookName,
      bookName: formData.bookName,
      author: formData.author,
      publicer: formData.publicer,
      category: formData.category,
      tag: formData.tag,
      addDate: formData.addDate || today,
      progress: formData.progress,
      status: formData.status,
      rating: formData.rating,
      notes: formData.notes,
      modDate: today,
      '書籍ID': bookId,
      '書名': formData.bookName,
      '作者/導演': formData.author,
      '來源/出版社': formData.publicer,
      '分類': formData.category,
      '標籤': formData.tag,
      '加入日期': formData.addDate || today,
      book: {
        bookId,
        bookName: formData.bookName,
        author: formData.author,
        publicer: formData.publicer,
        category: formData.category,
        tag: formData.tag,
        addDate: formData.addDate || today,
        title: formData.bookName,
        '書籍ID': bookId,
        '書名': formData.bookName,
        '作者/導演': formData.author,
        '來源/出版社': formData.publicer,
        '分類': formData.category,
        '標籤': formData.tag,
        '加入日期': formData.addDate || today
      },
      management: {
        No: selectedBook ? selectedBook.management.No : '',
        bookId,
        progress: formData.progress,
        status: formData.status,
        rating: formData.rating,
        notes: formData.notes,
        modDate: today,
        '0': formData.progress,
        '4': formData.rating,
        reading: formData.status,
        'test notes': formData.notes,
        編號: selectedBook ? selectedBook.management.No : '',
        '書籍ID': bookId,
        進度: formData.progress,
        閱讀狀態: formData.status,
        評分: formData.rating,
        心得筆記: formData.notes,
        修改日期: today
      }
    };

    return normalizedBook;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bookName) return;

    const bookId = selectedBook ? selectedBook.bookId : 'book_' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    const payload = buildBookPayload(selectedBook ? 'update' : 'add', formData, selectedBook, bookId, today);

    setSubmitStatus({ type: 'success', message: '送出中，請稍候...' });
    try {
      // mode: 'no-cors' bypasses the GAS 302-redirect CORS block in Chrome.
      // The response is opaque (unreadable), but GAS still processes the request.
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      // Optimistically treat as success; re-fetch list to confirm
      const action = selectedBook ? '更新' : '新增';
      setSubmitStatus({ type: 'success', message: `${action}成功！重新整理中...` });
      resetForm();
      // Give GAS a moment to commit the write before reading back
      setTimeout(() => fetchBooks(), 1500);
    } catch (error) {
      console.error('Error saving book:', error);
      setSubmitStatus({ type: 'error', message: `連線錯誤：${error.message}` });
    }
  };

  const handleDelete = async (bookId, e) => {
    e.stopPropagation();
    if (!window.confirm('確定要移除此項目嗎？')) return;

    try {
      // mode: 'no-cors' bypasses the GAS 302-redirect CORS block in Chrome.
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'delete',
          bookId,
          id: bookId,
          title: selectedBook?.bookName || '',
          deleteId: bookId,
          targetId: bookId,
          '書籍ID': bookId,
          '書名': selectedBook?.bookName || '',
          book: { bookId, '書籍ID': bookId },
          management: { bookId, '書籍ID': bookId }
        }),
        mode: 'no-cors'
      });
      if (selectedBook && selectedBook.bookId === bookId) {
        setSelectedBook(null);
      }
      // Give GAS a moment to commit before re-fetching
      setTimeout(() => fetchBooks(), 1500);
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const selectBook = (book) => {
    setSelectedBook(book);
    setFormData({
      bookName: book.bookName,
      author: book.author || '',
      publicer: book.publicer || '',
      category: book.category || '書籍',
      tag: book.tag || '',
      addDate: book.addDate || new Date().toISOString().split('T')[0],
      progress: Number(book.management.progress) || 0,
      status: book.management.status || '待讀',
      rating: Number(book.management.rating) || 5,
      notes: book.management.notes || ''
    });
  };

  const resetForm = () => {
    setSelectedBook(null);
    setFormData({
      bookName: '',
      author: '',
      publicer: '',
      category: '書籍',
      tag: '',
      addDate: new Date().toISOString().split('T')[0],
      progress: 0,
      status: '待讀',
      rating: 5,
      notes: ''
    });
  };

  const filteredBooks = books.filter(book => {
    const normalizedBook = normalizeBook(book) || book;
    const searchText = `${normalizedBook.bookName || ''} ${normalizedBook.author || ''} ${normalizedBook.tag || ''}`.toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || normalizedBook.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || normalizedBook.management?.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen pb-12 text-stone-800 selection:bg-amber-100 selection:text-amber-900">
      {/* 導航欄 */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-800">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-stone-900 font-serif">BookMind</h1>
            <p className="text-xs text-stone-500">個人書房與心智第二大腦</p>
          </div>
        </div>
        <div className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
          已收錄 {books.length} 個項目
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左側：編輯表單 */}
        <section className="lg:col-span-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-bold text-stone-900 flex items-center font-serif">
              {selectedBook ? <Edit3 size={18} className="mr-2 text-amber-700" /> : <Plus size={18} className="mr-2 text-amber-700" />}
              {selectedBook ? '編輯收錄項目' : '新增知識收錄'}
            </h2>
            {selectedBook && (
              <button 
                onClick={resetForm}
                className="text-xs text-stone-400 hover:text-stone-600 flex items-center space-x-1"
              >
                <RotateCcw size={12} />
                <span>取消修改</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">名稱 *</label>
              <input 
                type="text" 
                name="bookName"
                value={formData.bookName}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                placeholder="書名、影集或文章標題"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">作者/導演</label>
                <input 
                  type="text" 
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                  placeholder="作者、導演或來源"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">來源/出版社</label>
                <input 
                  type="text" 
                  name="publicer"
                  value={formData.publicer}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                  placeholder="出版社或網站名稱"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">分類</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                >
                  <option value="書籍">📚 書籍</option>
                  <option value="影集">🎬 影集</option>
                  <option value="文章">📰 文章</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">自訂標籤 (Tag)</label>
                <input 
                  type="text" 
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
                  placeholder="標籤，多個用逗號隔開"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">加入書庫日期</label>
              <input 
                type="date" 
                name="addDate"
                value={formData.addDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
              />
            </div>

            <div className="border-t border-stone-100 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">閱讀狀態</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="待讀">⏳ 待讀</option>
                    <option value="閱讀中">⚡ 閱讀中</option>
                    <option value="已完讀">✅ 已完讀</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">評分 (1-5)</label>
                  <select 
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 分</option>
                    <option value="4">⭐⭐⭐⭐ 4 分</option>
                    <option value="3">⭐⭐⭐ 3 分</option>
                    <option value="2">⭐⭐ 2 分</option>
                    <option value="1">⭐ 1 分</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-500 mb-1">
                  <span>閱讀進度</span>
                  <span>{formData.progress}%</span>
                </div>
                <input 
                  type="range" 
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleInputChange}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">讀書筆記心得 (支援 Markdown)</label>
              <textarea 
                name="notes"
                rows="4"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition font-mono"
                placeholder="在此紀錄心得、佳句或摘要..."
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full bg-amber-800 hover:bg-amber-900 text-stone-100 py-2.5 rounded-lg text-sm font-semibold transition duration-200 mt-2 flex justify-center items-center space-x-2"
            >
              <span>{selectedBook ? '確認修改' : '加入書本庫'}</span>
            </button>
            {submitStatus && (
              <p className={`text-xs text-center mt-1 ${submitStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {submitStatus.message}
              </p>
            )}
          </form>
        </section>

        {/* 右側：搜尋與卡片列表 */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* 篩選器與搜尋 */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="搜尋書名、作者或標籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-600 transition"
              />
            </div>
            
            <div className="flex space-x-3 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 w-1/2 md:w-auto">
                <Filter size={14} className="text-stone-400" />
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1.5 border border-stone-200 rounded-lg text-xs bg-white text-stone-600 focus:outline-none"
                >
                  <option value="All">全部類別</option>
                  <option value="書籍">書籍</option>
                  <option value="影集">影集</option>
                  <option value="文章">文章</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 w-1/2 md:w-auto">
                <Bookmark size={14} className="text-stone-400" />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 py-1.5 border border-stone-200 rounded-lg text-xs bg-white text-stone-600 focus:outline-none"
                >
                  <option value="All">全部狀態</option>
                  <option value="待讀">待讀</option>
                  <option value="閱讀中">閱讀中</option>
                  <option value="已完讀">已完讀</option>
                </select>
              </div>
            </div>
          </div>

          {/* 列表載入狀態 */}
          {loading ? (
            <div className="text-center py-16 text-stone-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800 mx-auto mb-4"></div>
              <span>讀取書房珍藏中...</span>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white text-center py-16 rounded-2xl border border-dashed border-stone-300 text-stone-400 font-serif">
              書架上還沒有符合條件的項目，開始新增吧。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map((book) => {
                const isSelected = selectedBook && selectedBook.bookId === book.bookId;
                const noteHtml = marked.parse(book.management.notes || '');

                return (
                  <div 
                    key={book.bookId}
                    onClick={() => selectBook(book)}
                    className={`bg-white p-5 rounded-2xl border ${isSelected ? 'border-amber-800 ring-1 ring-amber-800 bg-amber-50/20' : 'border-stone-200/80'} hover:border-amber-700/50 hover:shadow-md cursor-pointer transition flex flex-col justify-between`}
                  >
                    <div>
                      {/* 上部標記 */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {book.category}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            book.management.status === '已完讀' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            book.management.status === '閱讀中' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-stone-50 text-stone-500 border border-stone-200'
                          }`}>
                            {book.management.status}
                          </span>
                          <button 
                            onClick={(e) => handleDelete(book.bookId, e)}
                            className="text-stone-400 hover:text-rose-600 p-0.5 transition"
                            title="刪除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* 書名/作者 */}
                      <h3 className="font-bold text-stone-900 text-base font-serif mb-1 line-clamp-1">
                        {book.bookName}
                      </h3>
                      <p className="text-stone-500 text-xs mb-3">
                        {book.author ? `${book.author}` : '未知作者'} {book.publicer ? `· ${book.publicer}` : ''}
                      </p>

                      {/* 進度條 */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                          <span>進度</span>
                          <span>{book.management.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1">
                          <div 
                            className="bg-amber-700 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${book.management.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 筆記摘要 (Markdown 渲染) */}
                      {book.management.notes && (
                        <div className="bg-stone-50/80 p-3 rounded-lg border border-stone-100 text-stone-600 text-xs mb-3 line-clamp-3 prose prose-stone">
                          <div dangerouslySetInnerHTML={{ __html: noteHtml }}></div>
                        </div>
                      )}
                    </div>

                      {/* 卡片底部 */}
                    <div className="border-t border-stone-100 pt-3 mt-2 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-stone-400">
                        <div className="flex items-center space-x-1">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span className="font-bold text-stone-600">{book.management.rating} 分</span>
                        </div>
                        <div className="flex space-x-1.5 items-center">
                          {book.tag && book.tag.split(',').map((t, idx) => (
                            <span key={idx} className="bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">
                              #{t.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 入庫日期 */}
                      <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1.5">
                        <span className="text-stone-500">📅 入庫 {book.addDate ? book.addDate : '未設定'}</span>
                        <span className="text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 rounded border border-amber-200">點擊編輯</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
