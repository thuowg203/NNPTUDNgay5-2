// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Màu sắc cho từng danh mục
const categoryColors = {
    'Electronics': '#0d6efd',
    'Clothes': '#6f42c1',
    'Furniture': '#d63384',
    'Shoes': '#fd7e14',
    'Miscellaneous': '#198754'
};

// Lưu danh sách sản phẩm gốc
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortBy = null; // 'title-asc', 'title-desc', 'price-asc', 'price-desc'
let selectedProduct = null; // Lưu sản phẩm đang xem chi tiết

// Lấy dữ liệu từ API
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu từ API');
        }

        allProducts = await response.json();

        // Ẩn loading, hiển thị nội dung
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // Hiển thị sản phẩm
        displayProducts(allProducts);

        // Thêm event listener cho tìm kiếm
        setupSearchListener();

        // Thêm event listener cho items per page
        setupItemsPerPageListener();

        // Thêm event listener cho sắp xếp
        setupSortListeners();

        // Thêm event listener cho export CSV
        setupExportListener();

    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message;
    }
}

// Hiển thị sản phẩm trong bảng
function displayProducts(products) {
    const tbody = document.getElementById('productsTable');
    const totalProductsSpan = document.getElementById('totalProducts');

    // Áp dụng sắp xếp nếu có
    let displayList = applySort(products);

    // Cập nhật danh sách sản phẩm được lọc
    filteredProducts = displayList;

    // Cập nhật tổng số sản phẩm
    totalProductsSpan.textContent = allProducts.length;

    // Tính số trang
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Nếu không có sản phẩm
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    // Lấy sản phẩm của trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    // Xóa nội dung cũ
    tbody.innerHTML = '';

    // Thêm từng sản phẩm vào bảng
    pageProducts.forEach(product => {
        const categoryName = product.category?.name || 'N/A';
        const categoryColor = categoryColors[categoryName] || '#6c757d';
        const imageUrl = product.images?.[0] || 'https://via.placeholder.com/70?text=No+Image';
        const price = product.price ? `$${product.price.toLocaleString()}` : 'N/A';
        const description = product.description || 'Không có mô tả';

        const row = `
            <tr class="product-row" title="${description}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" onclick="showProductDetail(${product.id})">
                <td><strong>${product.id}</strong></td>
                <td>
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${product.title}">
                        ${product.title}
                    </div>
                </td>
                <td><span class="price">${price}</span></td>
                <td>
                    <span class="category-badge" style="background-color: ${categoryColor};">
                        ${categoryName}
                    </span>
                </td>
                <td>
                    <img src="${imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/70?text=Error'">
                </td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });

    // Khởi tạo tooltip cho tất cả dòng sản phẩm
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            delay: { show: 200, hide: 0 }
        });
    });

    // Hiển thị pagination
    if (totalPages > 1) {
        document.getElementById('paginationContainer').style.display = 'block';
        updatePagination(totalPages);
    } else {
        document.getElementById('paginationContainer').style.display = 'none';
    }
}

// Thiết lập listener cho tìm kiếm
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Lọc sản phẩm theo tên
        const searched = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
        
        // Hiển thị kết quả tìm kiếm
        if (searchTerm === '') {
            // Nếu ô tìm kiếm trống, hiển thị tất cả sản phẩm
            displayProducts(allProducts);
            document.getElementById('searchInfo').style.display = 'none';
            document.getElementById('noResults').style.display = 'none';
        } else if (searched.length === 0) {
            // Nếu không tìm thấy sản phẩm nào
            document.getElementById('productsTable').innerHTML = '';
            document.getElementById('totalProducts').textContent = allProducts.length;
            document.getElementById('searchInfo').style.display = 'inline';
            document.getElementById('foundProducts').textContent = '0';
            document.getElementById('noResults').style.display = 'block';
            document.getElementById('searchTerm').textContent = e.target.value;
            document.getElementById('paginationContainer').style.display = 'none';
        } else {
            // Hiển thị sản phẩm tìm thấy
            displayProducts(searched);
            document.getElementById('searchInfo').style.display = 'inline';
            document.getElementById('foundProducts').textContent = searched.length;
            document.getElementById('noResults').style.display = 'none';
        }
    });
}

// Thiết lập listener cho items per page
function setupItemsPerPageListener() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    
    itemsPerPageSelect.addEventListener('change', function(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayProducts(filteredProducts);
    });
}

// Cập nhật pagination
function updatePagination(totalPages) {
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    // Disable nút Previous nếu ở trang 1
    const prevBtn = document.getElementById('prevBtn');
    if (currentPage === 1) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }
    
    // Disable nút Next nếu ở trang cuối
    const nextBtn = document.getElementById('nextBtn');
    if (currentPage === totalPages) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}

// Chuyển trang trước
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts(filteredProducts);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Chuyển trang tiếp
function nextPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProducts(filteredProducts);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Thiết lập listener cho sắp xếp
function setupSortListeners() {
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');
    
    sortTitleBtn.addEventListener('click', function() {
        if (sortBy === 'title-asc') {
            sortBy = 'title-desc';
            sortTitleBtn.textContent = '⬇';
        } else {
            sortBy = 'title-asc';
            sortTitleBtn.textContent = '⬆';
        }
        sortPriceBtn.textContent = '⬍'; // Reset price button
        currentPage = 1;
        displayProducts(applySort(filteredProducts));
    });
    
    sortPriceBtn.addEventListener('click', function() {
        if (sortBy === 'price-asc') {
            sortBy = 'price-desc';
            sortPriceBtn.textContent = '⬇';
        } else {
            sortBy = 'price-asc';
            sortPriceBtn.textContent = '⬆';
        }
        sortTitleBtn.textContent = '⬍'; // Reset title button
        currentPage = 1;
        displayProducts(applySort(filteredProducts));
    });
}

// Áp dụng sắp xếp
function applySort(products) {
    let sorted = [...products];
    
    if (sortBy === 'title-asc') {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
        sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'price-asc') {
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    return sorted;
}

// Thiết lập listener cho export CSV
function setupExportListener() {
    const exportBtn = document.getElementById('exportBtn');
    
    exportBtn.addEventListener('click', function() {
        exportToCSV();
    });
}

// Export dữ liệu ra CSV
function exportToCSV() {
    if (filteredProducts.length === 0) {
        alert('Không có dữ liệu để export!');
        return;
    }

    // Tạo header cho CSV
    const headers = ['ID', 'Tên Sản Phẩm', 'Giá', 'Danh Mục', 'Mô Tả'];
    
    // Tạo dòng dữ liệu
    const rows = filteredProducts.map(product => [
        product.id,
        `"${product.title.replace(/"/g, '""')}"`, // Escape dấu ngoặc kép
        product.price || 'N/A',
        product.category?.name || 'N/A',
        `"${(product.description || 'Không có mô tả').replace(/"/g, '""')}"` // Escape dấu ngoặc kép
    ]);

    // Kết hợp header và rows
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    // Tạo blob từ content
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Tạo link để download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Hiển thị thông báo thành công
    alert(`✅ Export thành công! \n${filteredProducts.length} sản phẩm được lưu.`);
}

// Hiển thị chi tiết sản phẩm trong Modal
function showProductDetail(productId) {
    selectedProduct = allProducts.find(p => p.id === productId);
    
    if (!selectedProduct) {
        alert('Sản phẩm không tìm thấy!');
        return;
    }

    // Cập nhật view mode
    document.getElementById('modalTitle').textContent = selectedProduct.title;
    document.getElementById('modalId').textContent = `ID: ${selectedProduct.id}`;
    document.getElementById('modalPrice').textContent = `$${selectedProduct.price?.toLocaleString() || 'N/A'}`;
    document.getElementById('modalCategory').textContent = selectedProduct.category?.name || 'N/A';
    document.getElementById('modalCategory').className = `badge ${getCategoryColor(selectedProduct.category?.name)}`;
    document.getElementById('modalDescription').textContent = selectedProduct.description || 'Không có mô tả';
    
    const imageUrl = selectedProduct.images?.[0] || 'https://via.placeholder.com/200?text=No+Image';
    document.getElementById('modalImage').src = imageUrl;

    // Cập nhật edit form
    document.getElementById('editTitle').value = selectedProduct.title;
    document.getElementById('editPrice').value = selectedProduct.price || 0;
    document.getElementById('editDescription').value = selectedProduct.description || '';
    document.getElementById('editCategoryId').value = selectedProduct.category?.id || 1;

    // Đặt lại về view mode
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Lấy class color cho category badge
function getCategoryColor(categoryName) {
    const colorMap = {
        'Electronics': 'bg-primary',
        'Clothes': 'bg-secondary',
        'Furniture': 'bg-danger',
        'Shoes': 'bg-warning text-dark',
        'Miscellaneous': 'bg-success'
    };
    return colorMap[categoryName] || 'bg-secondary';
}

// Toggle chế độ chỉnh sửa
function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (editMode.style.display === 'none') {
        // Chuyển sang edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    } else {
        // Quay lại view mode
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }
}

// Lưu thay đổi thông qua API
async function saveChanges() {
    if (!selectedProduct) return;

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Đang lưu...';

    try {
        const updatedData = {
            title: document.getElementById('editTitle').value,
            price: parseFloat(document.getElementById('editPrice').value),
            description: document.getElementById('editDescription').value,
            categoryId: parseInt(document.getElementById('editCategoryId').value)
        };

        const response = await fetch(`${API_URL}/${selectedProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Cập nhật dữ liệu trong mảng allProducts
        const index = allProducts.findIndex(p => p.id === selectedProduct.id);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedData };
            selectedProduct = allProducts[index];
        }

        // Quay lại view mode
        toggleEditMode();
        
        // Cập nhật lại hiển thị
        showProductDetail(selectedProduct.id);
        
        alert('✅ Cập nhật sản phẩm thành công!');
        
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        alert(`❌ Lỗi: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Tạo sản phẩm mới
async function createProduct() {
    const createBtn = document.getElementById('createProductBtn');
    const originalText = createBtn.textContent;
    
    // Validate form
    const form = document.getElementById('createForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    createBtn.disabled = true;
    createBtn.textContent = '⏳ Đang tạo...';

    try {
        const newProduct = {
            title: document.getElementById('createTitle').value.trim(),
            price: parseFloat(document.getElementById('createPrice').value),
            description: document.getElementById('createDescription').value.trim(),
            categoryId: parseInt(document.getElementById('createCategoryId').value),
            images: [document.getElementById('createImages').value.trim()]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Thêm sản phẩm mới vào đầu mảng
        allProducts.unshift(result);
        
        // Reset form
        form.reset();
        
        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();
        
        // Refresh hiển thị
        displayProducts(allProducts);
        
        alert('✅ Tạo sản phẩm mới thành công!');
        
    } catch (error) {
        console.error('Lỗi khi tạo sản phẩm:', error);
        alert(`❌ Lỗi: ${error.message}`);
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = originalText;
    }
}

// Load dữ liệu khi trang tải xong
document.addEventListener('DOMContentLoaded', loadProducts);

