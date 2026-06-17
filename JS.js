<script>
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

  function loadDashboardData() {
    google.script.run
      .withSuccessHandler(function(data) {
        awardsCachedData = data;
        renderData(data); 
        calculateStats(data);
      })
      .withFailureHandler(function(err) {
        console.error("Error loading data: ", err);
        var errMsg = '<tr><td colspan="5" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>ไม่สามารถโหลดข้อมูลได้</td></tr>';
        document.getElementById('awardsTableBody').innerHTML = errMsg;
      })
      .getAwardsData();
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

  /**
   * 🌟 ปรับปรุงใหม่: วาดข้อมูลแบบการ์ดกริด มีรูปภาพพรีวิว และกดคลิกได้ทั้งใบ
   */
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
      
      // ส่วนวิเคราะห์เพื่อสร้าง HTML รูปภาพพรีวิวด้านบนการ์ด
      var cardPreviewHtml = '';
      if (item.fileId) {
        var lowerUrl = item.fileUrl ? item.fileUrl.toLowerCase() : '';
        
        // ถ้าเป็นไฟล์ PDF หรือไฟล์อื่นๆ ที่ไม่ใช่รูปภาพเด่นชัด
        if (lowerUrl.includes('.pdf') || (!lowerUrl.match(/\.(jpeg|jpg|gif|png)$/) && lowerUrl !== '')) {
          var imgUrl = "https://lh3.googleusercontent.com/d/" + item.fileId + "=w800";
          cardPreviewHtml = '<div class="card-preview-container">' +
                              '<img src="' + imgUrl + '" class="card-thumbnail-img" alt="ภาพหลักฐานผลงาน">' +
                            '</div>';
        } else {
          // ถ้าเป็นรูปภาพ ให้ดึง Link Thumbnail ตรงมาจาก Google Drive มาส่องพรีวิว
          var imgUrl = "https://lh3.googleusercontent.com/d/" + item.fileId + "=w800";
          cardPreviewHtml = '<div class="card-preview-container">' +
                              '<img src="' + imgUrl + '" class="card-thumbnail-img" alt="ภาพหลักฐานผลงาน">' +
                            '</div>';
        }
      } else {
        // กรณีไม่มีไฟล์แนบส่งเข้ามาแต่แรก
        cardPreviewHtml = '<div class="card-preview-container bg-light text-muted">' +
                            '<i class="bi bi-image card-placeholder-icon text-black-50"></i>' +
                          '</div>';
      }

      // ฝังเหตุการณ์ onclick ไว้ที่ตัวพ่อโครงสร้างการ์ด และเปลี่ยนท้ายปุ่มเป็นลิงก์ข้อความหรูๆ
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

  /**
   * ฟังก์ชันค้นหาและกรองข้อมูลแบบเรียลไทม์ (เวอร์ชันปลอดภัย บั๊กไม่กิน)
   */
  function filterData() {
    var searchText = document.getElementById('searchBar').value.toLowerCase();
    
    var filtered = awardsCachedData.filter(function(item) {
      // ใช้ String() ครอบ และเช็คค่าว่าง เพื่อแปลงทุกอย่าง (ตัวเลข/ค่าว่าง) ให้กลายเป็นตัวอักษรก่อน .toLowerCase()
      var title = item.title ? String(item.title).toLowerCase() : '';
      var category = item.category ? String(item.category).toLowerCase() : '';
      var year = item.year ? String(item.year).toLowerCase() : '';
      var id = item.id ? String(item.id).toLowerCase() : '';
      
      return title.includes(searchText) || 
            category.includes(searchText) || 
            year.includes(searchText) || 
            id.includes(searchText);
    });
    
    renderData(filtered); // วาดข้อมูลใหม่ตามมุมมองปัจจุบัน
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

  function submitDataToServer(payload) {
    google.script.run
      .withSuccessHandler(function(response) {
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
            loadDashboardData();
          });
        } else {
          showErrorAlert(response.message);
        }
      })
      .withFailureHandler(function(err) {
        setLoadingState(false);
        showErrorAlert(err.toString());
      })
      .saveAward(payload);
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
      var lowerUrl = item.fileUrl.toLowerCase();
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('id=') || !lowerUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
        var embedUrl = "https://drive.google.com/file/d/" + item.fileId + "/preview";
        container.innerHTML = '<iframe src="' + embedUrl + '" class="preview-pdf" allow="autoplay"></iframe>';
      } else {
        var imgUrl = "https://drive.google.com/uc?export=view&id=" + item.fileId;
        container.innerHTML = '<img src="' + imgUrl + '" class="img-fluid preview-img rounded shadow-sm" alt="ตัวอย่างหลักฐานเกียรติบัตร">';
      }
    }
    
    detailsModalObj.show();
  }
</script>
