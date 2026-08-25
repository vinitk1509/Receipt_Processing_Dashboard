from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    Base Pydantic schema configured for automatic camelCase serialization.
    Equivalent to Spring Boot DTO with Jackson PropertyNamingStrategies.LOWER_CAMEL_CASE
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )
