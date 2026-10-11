import { database } from './firebase-config.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const seedUsers = {
    // Super Admin
    "thangtcnb_at_gmail_com": {
        fullName: "Phạm Ngọc Thắng (Super Admin)",
        email: "thangtcnb@gmail.com",
        password: "123456",
        role: "SUPER_ADMIN",
        deptCode: "BGD"
    },
    // BGD
    "yenlinhbt_at_ufm_edu_vn": {
        fullName: "Bùi Thị Yến Linh",
        email: "yenlinhbt@ufm.edu.vn",
        password: "123",
        role: "BGD",
        deptCode: "BGD"
    },
    "lexuanlam_at_ufm_edu_vn": {
        fullName: "Lê Xuân Lãm",
        email: "lexuanlam@ufm.edu.vn",
        password: "123",
        role: "BGD",
        deptCode: "BGD"
    },
    // HCTV
    "tranthibichlien_at_ufm_edu_vn": {
        fullName: "Trần Thị Bích Liên",
        email: "tranthibichlien@ufm.edu.vn",
        password: "123",
        role: "TRUONG_PHONG",
        deptCode: "HCTV"
    },
    "nguyenthiphuongthao_at_ufm_edu_vn": {
        fullName: "Nguyễn Thị Phương Thảo",
        email: "nguyenthiphuongthao@ufm.edu.vn",
        password: "123",
        role: "PHO_PHONG",
        deptCode: "HCTV"
    },
    "tranthitam_at_ufm_edu_vn": {
        fullName: "Trần Thị Tâm",
        email: "tranthitam@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    "huynhthianhtung_at_ufm_edu_vn": {
        fullName: "Huỳnh Thị Anh Tùng",
        email: "huynhthianhtung@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    "nguyenthikimdung_at_ufm_edu_vn": {
        fullName: "Nguyễn Thị Kim Dung",
        email: "nguyenthikimdung@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    "phamngocthang_at_ufm_edu_vn": {
        fullName: "Phạm Ngọc Thắng",
        email: "phamngocthang@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    "dinhthanhha_at_ufm_edu_vn": {
        fullName: "Đinh Thanh Hà",
        email: "dinhthanhha@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    "tranthang_at_ufm_edu_vn": {
        fullName: "Bùi Trần Quyết Thắng",
        email: "tranthang@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "HCTV"
    },
    // DT_KH_QLSV
    "phamhoainam_at_ufm_edu_vn": {
        fullName: "Phạm Hoài Nam",
        email: "phamhoainam@ufm.edu.vn",
        password: "123",
        role: "TRUONG_PHONG",
        deptCode: "DT_KH_QLSV"
    },
    "huynhngocnghiem_at_ufm_edu_vn": {
        fullName: "Huỳnh Ngọc Nghiêm",
        email: "huynhngocnghiem@ufm.edu.vn",
        password: "123",
        role: "PHO_PHONG",
        deptCode: "DT_KH_QLSV"
    },
    "tranquanghai_at_ufm_edu_vn": {
        fullName: "Trần Quang Hải",
        email: "tranquanghai@ufm.edu.vn",
        password: "123",
        role: "PHO_PHONG",
        deptCode: "DT_KH_QLSV"
    },
    "phamthuhao_at_ufm_edu_vn": {
        fullName: "Phạm Thị Thu Hảo",
        email: "phamthuhao@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "tathiquynhngoc_at_ufm_edu_vn": {
        fullName: "Tạ Thị Quỳnh Ngọc",
        email: "tathiquynhngoc@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "huynhthithanhri_at_ufm_edu_vn": {
        fullName: "Huỳnh Thị Thanh Ri",
        email: "huynhthithanhri@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "vovanthao_at_ufm_edu_vn": {
        fullName: "Võ Văn Thảo",
        email: "vovanthao@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "nguyenthithuthuy_at_ufm_edu_vn": {
        fullName: "Nguyễn Thị Thu Thủy",
        email: "nguyenthithuthuy@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "diepquynhtram_at_ufm_edu_vn": {
        fullName: "Diệp Quỳnh Trâm",
        email: "diepquynhtram@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "tuyetdung_le_at_ufm_edu_vn": {
        fullName: "Lê Thị Tuyết Dung",
        email: "tuyetdung.le@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "nguyenquynhduyen_at_ufm_edu_vn": {
        fullName: "Nguyễn Thị Quỳnh Duyên",
        email: "nguyenquynhduyen@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    },
    "dangduythanhhuong_at_ufm_edu_vn": {
        fullName: "Đặng Duy Thanh Hương",
        email: "dangduythanhhuong@ufm.edu.vn",
        password: "123",
        role: "NHAN_VIEN",
        deptCode: "DT_KH_QLSV"
    }
};

const seedTasks = {
    "task_test_0": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 0",
        "host": "Phòng Đào tạo",
        "id": "task_test_0",
        "name": "Test task 0",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_1": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 1",
        "host": "Phòng Đào tạo",
        "id": "task_test_1",
        "name": "Test task 1",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_2": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 2",
        "host": "Phòng Đào tạo",
        "id": "task_test_2",
        "name": "Test task 2",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_3": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 3",
        "host": "Phòng Đào tạo",
        "id": "task_test_3",
        "name": "Test task 3",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_4": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 4",
        "host": "Phòng Đào tạo",
        "id": "task_test_4",
        "name": "Test task 4",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_5": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 5",
        "host": "Phòng Đào tạo",
        "id": "task_test_5",
        "name": "Test task 5",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_6": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 6",
        "host": "Phòng Đào tạo",
        "id": "task_test_6",
        "name": "Test task 6",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_7": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 7",
        "host": "Phòng Đào tạo",
        "id": "task_test_7",
        "name": "Test task 7",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_8": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 8",
        "host": "Phòng Đào tạo",
        "id": "task_test_8",
        "name": "Test task 8",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_9": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 9",
        "host": "Phòng Đào tạo",
        "id": "task_test_9",
        "name": "Test task 9",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_10": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 10",
        "host": "Phòng Đào tạo",
        "id": "task_test_10",
        "name": "Test task 10",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_11": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 11",
        "host": "Phòng Đào tạo",
        "id": "task_test_11",
        "name": "Test task 11",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_12": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 12",
        "host": "Phòng Đào tạo",
        "id": "task_test_12",
        "name": "Test task 12",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_13": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 13",
        "host": "Phòng Đào tạo",
        "id": "task_test_13",
        "name": "Test task 13",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_14": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 14",
        "host": "Phòng Đào tạo",
        "id": "task_test_14",
        "name": "Test task 14",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_15": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 15",
        "host": "Phòng Đào tạo",
        "id": "task_test_15",
        "name": "Test task 15",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_16": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 16",
        "host": "Phòng Đào tạo",
        "id": "task_test_16",
        "name": "Test task 16",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_17": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 17",
        "host": "Phòng Đào tạo",
        "id": "task_test_17",
        "name": "Test task 17",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_18": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 18",
        "host": "Phòng Đào tạo",
        "id": "task_test_18",
        "name": "Test task 18",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_test_19": {
        "createdAt": "2024-03-01T09:00:00Z",
        "deadline": "2024-03-31",
        "deptCode": "DT_KH_QLSV",
        "description": "Test task 19",
        "host": "Phòng Đào tạo",
        "id": "task_test_19",
        "name": "Test task 19",
        "primaryAssignee": "Nguyễn Văn B (NV Đào tạo)",
        "priority": "Bình thường",
        "status": "MOI_GIAO"
    },

    "task_hctv_1": {
        name: "Lập dự toán ngân sách hoạt động Quý 4/2026",
        deptCode: "HCTV",
        host: "Trần Thị Bích Liên",
        mainAssignee: "Huỳnh Thị Anh Tùng",
        subAssignees: "Phạm Ngọc Thắng",
        priority: "Cao",
        deadline: "2026-10-15",
        status: "DANG_THUC_HIEN",
        progress: 60,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_hctv_2": {
        name: "Bảo trì hệ thống máy tính và hạ tầng mạng phòng máy tính",
        deptCode: "HCTV",
        host: "Trần Thị Bích Liên",
        mainAssignee: "Đinh Thanh Hà",
        subAssignees: "Bùi Trần Quyết Thắng",
        priority: "Bình thường",
        deadline: "2026-11-01",
        status: "HOAN_THANH",
        progress: 100,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_hctv_3": {
        name: "Rà soát văn bản công văn đi/đến trong tháng 10",
        deptCode: "HCTV",
        host: "Nguyễn Thị Phương Thảo",
        mainAssignee: "Trần Thị Tâm",
        subAssignees: "",
        priority: "Bình thường",
        deadline: "2026-10-31",
        status: "CHO_DUYET",
        progress: 80,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_hctv_4": {
        name: "Mua sắm bổ sung văn phòng phẩm đợt 2",
        deptCode: "HCTV",
        host: "Trần Thị Bích Liên",
        mainAssignee: "Nguyễn Thị Kim Dung",
        subAssignees: "",
        priority: "Bình thường",
        deadline: "2026-11-15",
        status: "CHO_BGD_DUYET",
        progress: 0,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_hctv_5": {
        name: "Kiểm kê tài sản công dồn cuối năm 2026",
        deptCode: "HCTV",
        host: "Nguyễn Thị Phương Thảo",
        mainAssignee: "Phạm Ngọc Thắng",
        subAssignees: "Huỳnh Thị Anh Tùng",
        priority: "Cao",
        deadline: "2026-12-15",
        status: "DANG_THUC_HIEN",
        progress: 30,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_dt_1": {
        name: "Xây dựng Kế hoạch giảng dạy HK1 năm học 2026-2027",
        deptCode: "DT_KH_QLSV",
        host: "Phạm Hoài Nam",
        mainAssignee: "Tạ Thị Quỳnh Ngọc",
        subAssignees: "Võ Văn Thảo",
        priority: "Cao",
        deadline: "2026-08-15",
        status: "DANG_THUC_HIEN",
        progress: 70,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_dt_2": {
        name: "Tổ chức Tuần sinh hoạt công dân đầu khóa cho tân sinh viên",
        deptCode: "DT_KH_QLSV",
        host: "Huỳnh Ngọc Nghiêm",
        mainAssignee: "Huỳnh Thị Thanh Ri",
        subAssignees: "Diệp Quỳnh Trâm, Phạm Thị Thu Hảo",
        priority: "Cao",
        deadline: "2026-09-05",
        status: "HOAN_THANH",
        progress: 100,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_dt_3": {
        name: "Lập danh sách xét học bổng khuyến khích học tập HK2",
        deptCode: "DT_KH_QLSV",
        host: "Trần Quang Hải",
        mainAssignee: "Lê Thị Tuyết Dung",
        subAssignees: "Nguyễn Thị Quỳnh Duyên",
        priority: "Bình thường",
        deadline: "2026-11-20",
        status: "CHO_DUYET",
        progress: 90,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_dt_4": {
        name: "Kiểm tra, bổ sung tài liệu sách báo điện tử Thư viện",
        deptCode: "DT_KH_QLSV",
        host: "Huỳnh Ngọc Nghiêm",
        mainAssignee: "Nguyễn Thị Thu Thủy",
        subAssignees: "",
        priority: "Bình thường",
        deadline: "2026-10-30",
        status: "DANG_THUC_HIEN",
        progress: 40,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    },
    "task_dt_5": {
        name: "Đăng ký đề tài Nghiên cứu Khoa học cấp Phân hiệu năm 2026",
        deptCode: "DT_KH_QLSV",
        host: "Phạm Hoài Nam",
        mainAssignee: "Đặng Duy Thanh Hương",
        subAssignees: "",
        priority: "Cao",
        deadline: "2026-12-01",
        status: "CHO_BGD_DUYET",
        progress: 10,
        evidenceUrl: "",
        feedback: "",
        createdAt: new Date().toISOString()
    }
};

export async function checkAndSeedData() {
    try {
        const usersRef = ref(database, 'users');
        const tasksRef = ref(database, 'tasks');

        const usersSnapshot = await get(usersRef);
        const tasksSnapshot = await get(tasksRef);

        if (!usersSnapshot.exists()) {
            console.log("Seeding users data...");
            await set(usersRef, seedUsers);
        }

        if (!tasksSnapshot.exists()) {
            console.log("Seeding tasks data...");
            await set(tasksRef, seedTasks);
        }
    } catch (error) {
        console.error("Error checking/seeding data:", error);
    }
}
