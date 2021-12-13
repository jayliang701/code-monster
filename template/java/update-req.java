package NAMESPACE;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FILE_NAMEUpdateReq {

    @NotNull
    private Long id;

    @NotNull
    private Long userId;

    private Map<String, Object> biz;

}
