import styled from "styled-components";

const periods = ["Day", "Week", "Month", "Year", "All"];

export default function PeriodPicker({ period, onChange }: Props) {
  return (
    <Wrapper>
      {periods.map((p, i) => (
        <Period active={period === p} onClick={() => onChange(p)} key={i}>
          {p}
        </Period>
      ))}
    </Wrapper>
  );
}

interface Props {
  period: string;
  onChange: (newPeriod: string) => any;
}

const Wrapper = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.3rem;
  width: 100%;
`;

const Period = styled.div<{ active: boolean }>`
  padding: 0.5rem 0;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, ${(props) => (props.active ? ".1" : "0")});
  cursor: pointer;
  text-align: center;
  color: rgba(255, 255, 255, ${(props) => (props.active ? "1" : ".5")});
  backdrop-filter: blur(${(props) => (props.active ? "4px" : "0")});
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.23s ease-in-out;

  &:hover {
    backdrop-filter: blur(4px);
    background-color: rgba(255, 255, 255, 0.075);
  }
`;
