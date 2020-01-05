package NAMESPACE;

import static org.apache.ibatis.jdbc.SelectBuilder.*;

public class FILE_NAME {

    private final String table = "TABLE_NAME";

    public String find(Map<String, Object> params){
        return new SQL(){{
            SELECT("*");
            FROM(table);
            WHERE("id=" + params.get("id"));
        }}.toString();
    }

}