<script>
  // 🔴 นำ Web App URL ที่ได้จากการ Deploy มาใส่ที่นี่ครับ
  const API_URL = "https://script.google.com/macros/s/AKfycbzX--IJm1kAnFwVSGNApYxQN7rWiyQmpoJEs_hiYoyfMF1JU05f5uEuBsQmb9p7PdMdNg/exec";

  var awardsCachedData = [];
  var detailsModalObj = null;
  var currentViewMode = 'table'; // สถานะมุมมองเริ่มต้น ('table' หรือ 'grid')

  document.addEventListener('DOMContentLoaded', function() {
    detailsModalObj = new bootstrap.Modal(document.getElementById('detailsModal'));
    initializeYearDropdown();
    loadDashboardData();
    
    document.getElementById('searchBar').addEventListener('input', filterData);
    document.getElementById('awardForm').addEventListener('submit', handleFormSubmit);
  });

  function initializeYearDropdown() {
    var yearSelect = document.getElementById('year');
    var currentYearCE = new Date().getFullYear(); 
    var currentYearBE = currentYearCE + 543;     
    
    var optionsHtml = '<option value="" selected disabled>-- เลือกปี พ.ศ. --</option>';
    for (var i = 0; i < 11; i++) {
      var year = currentYearBE - i;
      optionsHtml += '<option value="' + year + '">' + year + '</option>';
    }
    yearSelect.innerHTML = optionsHtml;
  }

  /**
   * 🔄 ปรับปรุง: เปลี่ยนจาก google.script.run เป็น fetch (GET) เพื่อเรียกข้อมูลจาก API
   */
  function loadDashboardData() {
    fetch(API_URL)
      .then(function(response) {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(function(data) {
        // แก้ไขปัญหาวันที่สะสมให้อ่านง่ายเหมือนเวอร์ชันเดิม
        awardsCachedData = data.map(function(item) {
          if (item.timestamp) {
            var dateObj = new Date(item.timestamp);
            if (!isNaN(dateObj)) {
              item.timestamp = dateObj.toLocaleDateString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
            }
          }
          return item;
        });

        renderData(awardsCachedData); 
        calculateStats(awardsCachedData);
      })
      .catch(function(err) {
        console.error("Error loading data: ", err);
        var errMsg = '<tr><td colspan="5" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>ไม่สามารถโหลดข้อมูลได้ (' + err.message + ')</td></tr>';
        document.getElementById('awardsTableBody').innerHTML = errMsg;
      });
  }

  function calculateStats(data) {
    var total = data.length;
    var national = data.filter(function(item) { return item.category === 'ระดับชาติ'; }).length;
    var regional = data.filter(function(item) { return item.category === 'ระดับภาค'; }).length;
    var school = data.filter(function(item) { return item.category === 'ภายในสถานศึกษา'; }).length;
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-national').innerText = national;
    document.getElementById('stat-regional').innerText = regional;
    document.getElementById('stat-school').innerText = school;
  }

  function switchView(mode) {
    currentViewMode = mode;
    
    var btnTable = document.getElementById('btnViewTable');
    var btnGrid = document.getElementById('btnViewGrid');
    var tableContainer = document.getElementById('tableViewContainer');
    var gridContainer = document.getElementById('gridViewContainer');
    var viewTitle = document.getElementById('viewTitle');

    if (mode === 'table') {
      btnTable.classList.add('active');
      btnGrid.classList.remove('active');
      tableContainer.classList.remove('d-none');
      gridContainer.classList.add('d-none');
      viewTitle.innerHTML = '<i class="bi bi-table me-2"></i>รายการผลงานและรางวัล';
    } else {
      btnTable.classList.remove('active');
      btnGrid.classList.add('active');
      tableContainer.classList.add('d-none');
      gridContainer.classList.remove('d-none');
      viewTitle.innerHTML = '<i class="bi bi-grid-3x3-gap-fill me-2"></i>การ์ดผลงานและรางวัล';
    }
    
    filterData();
  }

  function renderData(data) {
    if (currentViewMode === 'table') {
      renderTableView(data);
    } else {
      renderGridView(data);
    }
  }

  function renderTableView(data) {
    var tbody = document.getElementById('awardsTableBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="bi bi-folder-x me-2 fs-5"></i>ไม่มีข้อมูลผลงานหรือรางวัลในระบบ</td></tr>';
      return;
    }
    
    var html = '';
    data.forEach(function(item) {
      var badgeClass = 'bg-secondary';
      if(item.category === 'ระดับชาติ') badgeClass = 'bg-danger';
      else if(item.category === 'ระดับภาค') badgeClass = 'bg-warning text-dark';
      else if(item.category === 'ภายในสถานศึกษา') badgeClass = 'bg-success';

      html += '<tr>' +
                '<td class="fw-bold text-secondary">' + item.id + '</td>' +
                '<td><div class="text-truncate" style="max-width: 380px;" title="' + item.title + '">' + item.title + '</div></td>' +
                '<td><span class="badge ' + badgeClass + '">' + item.category + '</span></td>' +
                '<td>' + item.year + '</td>' +
                '<td class="text-center">' +
                  '<button class="btn btn-sm btn-primary px-3" onclick="viewDetails(\'' + item.id + '\')"><i class="bi bi-search me-1"></i> ดูรายละเอียด</button>' +
                '</td>' +
              '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderGridView(data) {
    var gridBody = document.getElementById('awardsGridBody');
    if (data.length === 0) {
      gridBody.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-folder-x me-2 fs-4"></i>ไม่มีข้อมูลผลงานหรือรางวัลในระบบ</div>';
      return;
    }

    var html = '';
    data.forEach(function(item) {
      var badgeClass = 'bg-secondary';
      if(item.category === 'ระดับชาติ') badgeClass = 'bg-danger';
      else if(item.category === 'ระดับภาค') badgeClass = 'bg-warning text-dark';
      else if(item.category === 'ภายในสถานศึกษา') badgeClass = 'bg-success';

      var descText = item.description ? item.description : 'ไม่มีรายละเอียดอธิบายผลงาน';
      
      var cardPreviewHtml = '';
      if (item.fileId) {
        var lowerUrl = item.fileUrl ? item.fileUrl.toLowerCase() : '';
        var imgUrl = "https://lh3.googleusercontent.com/d/" + item.fileId + "=w800"; // อัปเดตลิงก์ดึงภาพพรีวิวให้เสถียรขึ้น
        
        cardPreviewHtml = '<div class="card-preview-container">' +
                            '<img src="' + imgUrl + '" class="card-thumbnail-img" alt="ภาพหลักฐานผลงาน" onerror="this.src=\'https://placehold.co/600x400?text=No+Preview\'">' +
                          '</div>';
      } else {
        cardPreviewHtml = '<div class="card-preview-container bg-light text-muted">' +
                            '<i class="bi bi-image card-placeholder-icon text-black-50"></i>' +
                          '</div>';
      }

      html += '<div class="col-12 col-md-6 col-lg-4">' +
                '<div class="card h-100 border border-light bg-white portfolio-card clickable-card shadow-sm" onclick="viewDetails(\'' + item.id + '\')">' +
                  cardPreviewHtml + 
                  '<div class="card-body d-flex flex-column p-4">' +
                    '<div class="d-flex justify-content-between align-items-center mb-3">' +
                      '<span class="badge ' + badgeClass + '">' + item.category + '</span>' +
                      '<small class="fw-bold text-muted">' + item.id + '</small>' +
                    '</div>' +
                    '<h6 class="card-title fw-bold text-dark text-line-clamp-2 mb-2" title="' + item.title + '">' + item.title + '</h6>' +
                    '<p class="card-text text-secondary small text-line-clamp-3 mb-4">' + descText + '</p>' +
                    '<div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top border-light">' +
                      '<span class="text-primary fw-bold small"><i class="bi bi-calendar-event me-1"></i>พ.ศ. ' + item.year + '</span>' +
                      '<span class="text-primary small fw-bold">ดูรายละเอียด <i class="bi bi-chevron-right small"></i></span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
    });
    gridBody.innerHTML = html;
  }

  function filterData() {
    var searchText = document.getElementById('searchBar').value.toLowerCase();
    
    var filtered = awardsCachedData.filter(function(item) {
      var title = item.title ? String(item.title).toLowerCase() : '';
      var category = item.category ? String(item.category).toLowerCase() : '';
      var year = item.year ? String(item.year).toLowerCase() : '';
      var id = item.id ? String(item.id).toLowerCase() : '';
      
      return title.includes(searchText) || 
            category.includes(searchText) || 
            year.includes(searchText) || 
            id.includes(searchText);
    });
    
    renderData(filtered);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    var form = document.getElementById('awardForm');
    
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    
    setLoadingState(true);
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    
    var awardPayload = {
      title: document.getElementById('title').value,
      category: document.getElementById('category').value,
      year: document.getElementById('year').value,
      description: document.getElementById('description').value,
      fileData: null,
      fileName: null,
      mimeType: null
    };

    if (file) {
      var reader = new FileReader();
      reader.onload = function(evt) {
        var base64Data = evt.target.result.split(',')[1];
        awardPayload.fileData = base64Data;
        awardPayload.fileName = file.name;
        awardPayload.mimeType = file.type;
        submitDataToServer(awardPayload);
      };
      reader.readAsDataURL(file);
    } else {
      submitDataToServer(awardPayload);
    }
  }

  /**
   * 📤 ปรับปรุง: เปลี่ยนจากการส่งด้วย google.script.run เป็น fetch (POST) ไปยัง API
   */
  function submitDataToServer(payload) {
    fetch(API_URL, {
      method: "POST",
      redirect: "follow", // จำเป็นอย่างยิ่งสำหรับ GAS API เพื่อรองรับการ Redirect
      headers: {
        "Content-Type": "text/plain;charset=utf-8" // ใช้ text/plain ป้องกันปัญหาระบบตรวจเช็ค CORS บางประเภท
      },
      body: JSON.stringify(payload)
    })
    .then(function(response) {
      if (!response.ok) throw new Error("ไม่สามารถส่งข้อมูลไปยังเซิร์ฟเวอร์ได้");
      return response.json();
    })
    .then(function(response) {
      setLoadingState(false);
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: response.message,
          confirmButtonText: 'ตกลง'
        }).then(function() {
          document.getElementById('awardForm').reset();
          document.getElementById('awardForm').classList.remove('was-validated');
          var dashboardTab = new bootstrap.Tab(document.getElementById('dashboard-tab'));
          dashboardTab.show();
          loadDashboardData(); // รีโหลดข้อมูลใหม่จาก API หลังบันทึกสำเร็จ
        });
      } else {
        showErrorAlert(response.message);
      }
    })
    .catch(function(err) {
      setLoadingState(false);
      showErrorAlert(err.toString());
    });
  }

  function setLoadingState(isLoading) {
    var btn = document.getElementById('btnSubmit');
    var text = document.getElementById('btnText');
    var spinner = document.getElementById('btnSpinner');
    
    if (isLoading) {
      btn.disabled = true;
      text.classList.add('d-none');
      spinner.classList.remove('d-none');
    } else {
      btn.disabled = false;
      text.classList.remove('d-none');
      spinner.classList.add('d-none');
    }
  }

  function showErrorAlert(msg) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาดในการบันทึก',
      text: msg,
      confirmButtonText: 'รับทราบ'
    });
  }

  function viewDetails(id) {
    var item = awardsCachedData.find(function(a) { return a.id === id; });
    if (!item) return;
    
    document.getElementById('modal-id').innerText = item.id;
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-year').innerText = item.year;
    document.getElementById('modal-timestamp').innerText = item.timestamp;
    document.getElementById('modal-description').innerText = item.description || "ไม่ได้ระบุคำอธิบาย";
    
    var badge = document.getElementById('modal-badge-category');
    badge.innerText = item.category;
    badge.className = 'badge ';
    if (item.category === 'ระดับชาติ') badge.classList.add('bg-danger');
    else if (item.category === 'ระดับภาค') badge.classList.add('bg-warning', 'text-dark');
    else if (item.category === 'ภายในสถานศึกษา') badge.classList.add('bg-success');
    
    var downloadBtn = document.getElementById('modal-download-btn');
    if (item.fileUrl) {
      downloadBtn.href = item.fileUrl;
      downloadBtn.classList.remove('disabled');
    } else {
      downloadBtn.removeAttribute('href');
      downloadBtn.classList.add('disabled');
    }

    var container = document.getElementById('previewContainer');
    container.innerHTML = ''; 
    
    if (!item.fileId) {
      container.innerHTML = '<span class="text-muted"><i class="bi bi-eye-slash me-2"></i> ไม่มีไฟล์หลักฐานแนบไว้ในระบบ</span>';
    } else {
      var lowerUrl = item.fileUrl ? item.fileUrl.toLowerCase() : '';
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('id=') || !lowerUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
        var embedUrl = "https://drive.google.com/file/d/" + item.fileId + "/preview";
        container.innerHTML = '<iframe src="' + embedUrl + '" class="preview-pdf" allow="autoplay" style="width:100%; height:400px; border:none;"></iframe>';
      } else {
        var imgUrl = "https://drive.google.com/uc?export=view&id=" + item.fileId;
        container.innerHTML = '<img src="' + imgUrl + '" class="img-fluid preview-img rounded shadow-sm" alt="ตัวอย่างหลักฐานเกียรติบัตร">';
      }
    }
    
    detailsModalObj.show();
  }
</script>
