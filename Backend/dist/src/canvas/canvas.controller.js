"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const canvas_service_1 = require("./canvas.service");
const canvas_dto_1 = require("./dto/canvas.dto");
let CanvasController = class CanvasController {
    canvasService;
    constructor(canvasService) {
        this.canvasService = canvasService;
    }
    create(req, dto) {
        return this.canvasService.create(req.user.id, dto);
    }
    findAll(req) {
        return this.canvasService.findAll(req.user.id);
    }
    findOne(id, req) {
        return this.canvasService.findOne(id, req.user.id);
    }
    save(id, req, dto) {
        return this.canvasService.save(id, req.user.id, dto);
    }
    remove(id, req) {
        return this.canvasService.remove(id, req.user.id);
    }
    share(id, req, dto) {
        return this.canvasService.share(id, req.user.id, dto);
    }
};
exports.CanvasController = CanvasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, canvas_dto_1.CreateCanvasDto]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, canvas_dto_1.SaveCanvasDto]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "save", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, canvas_dto_1.ShareCanvasDto]),
    __metadata("design:returntype", void 0)
], CanvasController.prototype, "share", null);
exports.CanvasController = CanvasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('canvas'),
    __metadata("design:paramtypes", [canvas_service_1.CanvasService])
], CanvasController);
//# sourceMappingURL=canvas.controller.js.map