package NAMESPACE;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ugeez.commons.base.base.CommonPage;
import com.ugeez.commons.base.base.IdDTO;
import com.ugeez.commons.base.enums.ErrorCode;
import com.ugeez.commons.base.exception.BusinessException;
import com.ugeez.commons.base.utils.DtoUtil;

import DTO_NAMESPACE.ENTITY_NAMEDto;
import SERVICE_NAMESPACE.ENTITY_NAMEService;
import INNER_DTO_NAMESPACE.ENTITY_NAMECreateReq;
import INNER_DTO_NAMESPACE.ENTITY_NAMEDeleteReq;
import INNER_DTO_NAMESPACE.ENTITY_NAMEUpdateReq;
import ENTITY_NAMESPACE.ENTITY_NAME;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("API_PREFIX/ENTITY_NAME_VAR")
public class ENTITY_NAMEController {
	
	@Autowired
	private ENTITY_NAMEService ENTITY_NAME_VARService;

    @GetMapping(value = "/query")
    public ENTITY_NAMEDto query(@RequestParam Long id) {
        ENTITY_NAME doc = ENTITY_NAME_VARService.getById(id);
        if (doc == null) {
            throw new BusinessException(ErrorCode.DATA_NOT_EXIST);
        }
        ENTITY_NAMEDto dto = DtoUtil.convert(doc, ENTITY_NAMEDto.class);
        return dto;
    }

    @GetMapping(value = "/list")
    public CommonPage<ENTITY_NAMEDto> list(@RequestParam Long page, @RequestParam Long pageSize) {
        IPage<ENTITY_NAME> docs = ENTITY_NAME_VARService.search(null, page, pageSize);
        return CommonPage.convert(docs, ENTITY_NAMEDto.class);
    }

    @PostMapping(value = "/create")
    public IdDTO<Long> create(@Valid @RequestBody ENTITY_NAMECreateReq req) {
        ENTITY_NAME doc = ENTITY_NAME_VARService.create(req.getUserId(), req.getBiz());
        return new IdDTO<>(doc.getId());
    }

    @PostMapping(value = "/update")
    public void update(@Valid @RequestBody ENTITY_NAMEUpdateReq req) {
        ENTITY_NAME doc = new ENTITY_NAME();
        doc.setId(req.getId());
        doc.setUserId(req.getUserId());
        doc.setBiz(req.getBiz());

        boolean isUpdated = ENTITY_NAME_VARService.updateById(doc);
        if (!isUpdated) {
            throw new BusinessException(ErrorCode.DATA_NOT_EXIST);
        }
    }

    @PostMapping(value = "/delete")
    public void delete(@Valid @RequestBody ENTITY_NAMEDeleteReq req) {
        boolean isDeleted = ENTITY_NAME_VARService.removeById(req.getId());
        if (!isDeleted) {
            throw new BusinessException(ErrorCode.DATA_NOT_EXIST);
        }
    }
}



