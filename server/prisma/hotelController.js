const prisma = require('../utils/prisma');
const { success, badRequest, forbidden, notFound, serverError } = require('../utils/response');

/**
 * 1. 商户新增酒店
 */
exports.createHotel = async (req, res, next) => {
  try {
    const { nameCn, nameEn, address, star, roomType, price, openTime, attractions, traffic, discount } = req.body;
    const { userId } = req.user; // 从Token解析的商户ID

    // 校验必填字段
    if (!nameCn || !address || !star || !price) {
      return badRequest(res, '酒店名称、地址、星级、价格为必填项');
    }

    // Prisma创建酒店（关联商户）
    const hotel = await prisma.hotel.create({
      data: {
        nameCn,
        nameEn: nameEn || '',
        address,
        star,
        roomType: roomType || [],
        price,
        openTime: openTime || '',
        attractions: attractions || [],
        traffic: traffic || '',
        discount: discount ? { type: discount.type, value: discount.value } : null,
        status: 'pending', // 默认待审核
        merchantId: userId
      },
      select: {
        id: true // 只返回酒店ID，符合ApiResponse<{hotelId:string}>
      }
    });

    // 响应（兼容原有格式）
    success(res, '酒店提交成功，待管理员审核', {
      hotelId: hotel.id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. 商户编辑酒店
 */
exports.updateHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const updateData = req.body;
    const { userId, role } = req.user;

    // 查找酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return notFound(res, '酒店不存在');
    }

    // 权限校验：商户只能编辑自己的酒店，管理员可编辑所有
    if (role !== 'admin' && hotel.merchantId !== userId) {
      return forbidden(res, '无权限编辑该酒店');
    }

    // Prisma更新酒店（只更新传入的字段）
    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        ...updateData,
        // 编辑后重置为待审核（业务规则）
        status: 'pending',
        rejectReason: null
      },
      select: {
        id: true
      }
    });

    success(res, '酒店信息更新成功，待管理员重新审核', {
      hotelId: updatedHotel.id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. 商户删除酒店
 */
exports.deleteHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { userId, role } = req.user;

    // 查找酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return notFound(res, '酒店不存在');
    }

    // 权限校验
    if (role !== 'admin' && hotel.merchantId !== userId) {
      return forbidden(res, '无权限删除该酒店');
    }

    // Prisma删除酒店
    await prisma.hotel.delete({
      where: { id: hotelId }
    });

    success(res, '酒店删除成功', null); // 无业务数据，返回ApiResponse<null>
  } catch (err) {
    next(err);
  }
};

/**
 * 4. 商户查询自有酒店列表（无分页）
 */
exports.getMerchantHotels = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Prisma查询（关联商户，只返回已提交的酒店）
    const hotels = await prisma.hotel.findMany({
      where: { merchantId: userId },
      orderBy: { createTime: 'desc' }, // 按创建时间倒序
      // 完整返回酒店字段（符合HotelItem类型）
      select: {
        id: true,
        nameCn: true,
        nameEn: true,
        address: true,
        star: true,
        roomType: true,
        price: true,
        openTime: true,
        attractions: true,
        traffic: true,
        discount: true,
        status: true,
        rejectReason: true,
        merchantId: true,
        createTime: true,
        updateTime: true
      }
    });

    // 响应（符合ApiResponse<HotelItem[]>）
    success(res, '查询成功', hotels);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. 查询酒店详情
 */
exports.getHotelDetail = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { userId, role } = req.user;

    // 查找酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        merchant: { // 关联查询商户信息（仅用户名）
          select: {
            username: true
          }
        }
      }
    });

    if (!hotel) {
      return notFound(res, '酒店不存在');
    }

    // 权限校验：商户只能看自己的，管理员可看所有，用户端只能看已通过的
    if (role === 'merchant' && hotel.merchantId !== userId) {
      return forbidden(res, '无权限查看该酒店');
    }
    if (role === 'user' && hotel.status !== 'passed') {
      return forbidden(res, '该酒店暂未上线');
    }

    // 响应（符合ApiResponse<HotelItem>）
    success(res, '查询成功', hotel);
  } catch (err) {
    next(err);
  }
};

/**
 * 6. 管理员审核酒店
 */
exports.reviewHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { status, rejectReason } = req.body;
    const { role } = req.user;

    // 权限校验：仅管理员可审核
    if (role !== 'admin') {
      return forbidden(res, '仅管理员可审核酒店');
    }

    // 校验参数
    if (!['passed', 'rejected'].includes(status)) {
      return badRequest(res, '审核状态只能是passed或rejected');
    }
    if (status === 'rejected' && !rejectReason) {
      return badRequest(res, '驳回必须填写原因');
    }

    // 更新酒店状态
    await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        status,
        rejectReason: status === 'rejected' ? rejectReason : null
      }
    });

    // 响应（符合ApiResponse<null>）
    success(res, status === 'passed' ? '酒店审核通过' : '酒店审核驳回', null);
  } catch (err) {
    next(err);
  }
};

/**
 * 7. 管理员上下线酒店
 */
exports.changeHotelStatus = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    // 权限校验
    if (role !== 'admin') {
      return forbidden(res, '仅管理员可调整酒店上下线状态');
    }

    // 校验参数
    if (!['passed', 'offline'].includes(status)) {
      return badRequest(res, '状态只能是passed（上线）或offline（下线）');
    }

    // 更新状态
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { status }
    });

    // 响应（符合ApiResponse<null>）
    success(res, status === 'passed' ? '酒店已上线' : '酒店已下线', null);
  } catch (err) {
    next(err);
  }
};

/**
 * 8. 分页查询酒店（管理员/用户端）
 */
exports.getHotelList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, city, star, minPrice, maxPrice } = req.query;
    const { role } = req.user;

    // 构建查询条件
    const where = {};

    // 管理员可查所有状态，用户端仅查已通过的
    if (role === 'admin' && status) {
      where.status = status;
    } else if (role !== 'admin') {
      where.status = 'passed';
    }

    // 模糊查询（地址含城市）
    if (city) {
      where.address = { contains: city };
    }

    // 星级筛选
    if (star) {
      where.star = parseInt(star);
    }

    // 价格区间
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Prisma分页查询（符合PageResult<HotelItem>）
    const [list, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { updateTime: 'desc' },
        select: {
          id: true,
          nameCn: true,
          nameEn: true,
          address: true,
          star: true,
          price: true,
          status: true,
          createTime: true
        }
      }),
      prisma.hotel.count({ where }) // 总条数
    ]);

    // 响应（符合ApiResponse<PageResult<HotelItem>>）
    success(res, '查询成功', {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    next(err);
  }
};
